import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { currentMonth } from "@/shared/utils/month";

import { seedBankWithItems } from "./card-fixtures";
import { type TestUser, admin, createTestUser, must, previousMonth } from "./helpers";

const paidMessage = (bank: string) =>
  `A fatura do ${bank} deste mês já foi paga. Desfaça o pagamento na Início para alterar.`;

describe("card_purchases", () => {
  let userA: TestUser;
  let userB: TestUser;

  /** Banco + tipo do usuário; categoria compartilhada pelos avulsos do teste. */
  const seedBank = async (user: TestUser, name: string) => {
    const category = must(await user.client.from("categories").insert({ name: `Tipo ${name}` }).select("id").single());
    const bank = must(await user.client.from("banks").insert({ name }).select("id").single());
    return { bankId: bank.id, categoryId: category.id };
  };

  const insertPurchase = (
    user: TestUser,
    { bankId, categoryId }: { bankId: string; categoryId: string },
    name = "Farmácia",
    amount_cents = 4590,
  ) =>
    user.client
      .from("card_purchases")
      .insert({ name, amount_cents, bank_id: bankId, category_id: categoryId })
      .select("id, month")
      .single();

  beforeAll(async () => {
    [userA, userB] = await Promise.all([createTestUser(), createTestUser()]);
  });

  afterAll(async () => {
    await Promise.all([userA.remove(), userB.remove()]);
  });

  test("month is forced to the current month on insert and is immutable", async () => {
    const seed = await seedBank(userA, "Nubank");

    const inserted = must(
      await userA.client
        .from("card_purchases")
        .insert({ name: "Mercado", amount_cents: 1000, bank_id: seed.bankId, category_id: seed.categoryId, month: previousMonth() })
        .select("id, month")
        .single(),
    );
    expect(inserted.month).toBe(currentMonth());

    const updated = must(
      await userA.client
        .from("card_purchases")
        .update({ month: previousMonth(), amount_cents: 2000 })
        .eq("id", inserted.id)
        .select("month, amount_cents")
        .single(),
    );
    expect(updated).toEqual({ month: currentMonth(), amount_cents: 2000 });
  });

  test("user cannot read, update or delete another user's purchases", async () => {
    const seed = await seedBank(userA, "Itaú");
    const { id } = must(await insertPurchase(userA, seed));

    const { data: read } = await userB.client.from("card_purchases").select("id").eq("id", id);
    expect(read).toEqual([]);

    const { data: updated } = await userB.client.from("card_purchases").update({ amount_cents: 1 }).eq("id", id).select();
    expect(updated).toEqual([]);

    const { data: deleted } = await userB.client.from("card_purchases").delete().eq("id", id).select();
    expect(deleted).toEqual([]);

    const { data: own } = await userA.client.from("card_purchases").select("amount_cents").eq("id", id).single();
    expect(own?.amount_cents).toBe(4590);
  });

  test("user cannot reference another user's bank or category", async () => {
    const seed = await seedBank(userA, "Inter");

    const { error } = await insertPurchase(userB, seed);
    expect(error?.code).toBe("23503");
  });

  test("purchases from past months cannot be changed", async () => {
    const seed = await seedBank(userA, "C6");
    const { id } = must(
      await admin
        .from("card_purchases")
        .insert({
          user_id: userA.userId,
          month: previousMonth(),
          name: "Antigo",
          amount_cents: 1000,
          bank_id: seed.bankId,
          category_id: seed.categoryId,
        })
        .select("id")
        .single(),
    );

    const message = "Só é possível alterar avulsos do mês atual.";
    const { error: updateError } = await userA.client.from("card_purchases").update({ amount_cents: 1 }).eq("id", id);
    expect(updateError).toMatchObject({ code: "P0001", message });

    const { error: deleteError } = await userA.client.from("card_purchases").delete().eq("id", id);
    expect(deleteError).toMatchObject({ code: "P0001", message });
  });

  test("purchases of a bank with a paid invoice cannot be written", async () => {
    const { bankId, ids } = await seedBankWithItems(userA, "Santander", [{ name: "Seguro", amount_cents: 3000 }]);
    const category = must(await userA.client.from("categories").insert({ name: "Saúde" }).select("id").single());
    const paid = { bankId, categoryId: category.id };
    const open = { ...(await seedBank(userA, "BB")), categoryId: category.id };

    const { id: paidPurchaseId } = must(await insertPurchase(userA, paid));
    const { id: openPurchaseId } = must(await insertPurchase(userA, open));

    must(await userA.client.rpc("pay_card", { p_bank_id: bankId, p_items: [{ card_item_id: ids.Seguro, included: true }] }));

    const blocked = { code: "P0001", message: paidMessage("Santander") };

    const { error: insertError } = await insertPurchase(userA, paid);
    expect(insertError).toMatchObject(blocked);

    const { error: updateError } = await userA.client
      .from("card_purchases")
      .update({ amount_cents: 1 })
      .eq("id", paidPurchaseId);
    expect(updateError).toMatchObject(blocked);

    const { error: moveOutError } = await userA.client
      .from("card_purchases")
      .update({ bank_id: open.bankId })
      .eq("id", paidPurchaseId);
    expect(moveOutError).toMatchObject(blocked);

    const { error: deleteError } = await userA.client.from("card_purchases").delete().eq("id", paidPurchaseId);
    expect(deleteError).toMatchObject(blocked);

    const { error: moveInError } = await userA.client
      .from("card_purchases")
      .update({ bank_id: bankId })
      .eq("id", openPurchaseId);
    expect(moveInError).toMatchObject(blocked);

    // Banco sem fatura paga segue editável
    const { error: openError } = await userA.client
      .from("card_purchases")
      .update({ amount_cents: 1 })
      .eq("id", openPurchaseId);
    expect(openError).toBeNull();
  });

  test("insert on behalf of another user is denied before revealing invoice status", async () => {
    const { bankId, ids } = await seedBankWithItems(userA, "Sicredi", [{ name: "Plano", amount_cents: 2000 }]);
    const category = must(await userA.client.from("categories").insert({ name: "Casa" }).select("id").single());
    must(await userA.client.rpc("pay_card", { p_bank_id: bankId, p_items: [{ card_item_id: ids.Plano, included: true }] }));

    const { error } = await userB.client
      .from("card_purchases")
      .insert({ user_id: userA.userId, name: "Sonda", amount_cents: 100, bank_id: bankId, category_id: category.id });
    expect(error?.code).toBe("42501");
    expect(error?.message).not.toContain("Sicredi");
  });

  test("blocks deleting bank or category in use", async () => {
    const seed = await seedBank(userA, "XP");
    must(await insertPurchase(userA, seed));

    const { error: bankError } = await userA.client.from("banks").delete().eq("id", seed.bankId);
    expect(bankError?.code).toBe("23503");

    const { error: categoryError } = await userA.client.from("categories").delete().eq("id", seed.categoryId);
    expect(categoryError?.code).toBe("23503");
  });

  test("deleting the user removes locked purchases", async () => {
    const user = await createTestUser();
    const { bankId, ids } = await seedBankWithItems(user, "Safra", [{ name: "Revista", amount_cents: 1500 }]);
    const category = must(await user.client.from("categories").insert({ name: "Lazer" }).select("id").single());
    must(await insertPurchase(user, { bankId, categoryId: category.id }));
    must(
      await admin
        .from("card_purchases")
        .insert({
          user_id: user.userId,
          month: previousMonth(),
          name: "Antigo",
          amount_cents: 1000,
          bank_id: bankId,
          category_id: category.id,
        })
        .select("id")
        .single(),
    );
    must(await user.client.rpc("pay_card", { p_bank_id: bankId, p_items: [{ card_item_id: ids.Revista, included: true }] }));

    const { error } = await user.remove();
    expect(error).toBeNull();

    const { data } = await admin.from("card_purchases").select("id").eq("user_id", user.userId);
    expect(data).toEqual([]);
  });
});
