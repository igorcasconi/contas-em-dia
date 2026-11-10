import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { type CardSelection, seedBankWithItems } from "./card-fixtures";
import { type TestUser, admin, createTestUser, must, previousMonth } from "./helpers";

describe("pay_card", () => {
  let user: TestUser;
  let other: TestUser;

  const payCard = (bankId: string, items: CardSelection[], as: TestUser = user) =>
    as.client.rpc("pay_card", { p_bank_id: bankId, p_items: items });

  const getItem = async (id: string) =>
    (await user.client.from("card_items").select("status, remaining_months, ended_at").eq("id", id).single()).data!;

  const getTotal = async (paymentId: string) =>
    (await user.client.from("payments").select("total_cents").eq("id", paymentId).single()).data?.total_cents;

  /** Avulso do mês atual no banco, com tipo próprio do dono. */
  const addPurchase = async (bankId: string, amount_cents: number, as: TestUser = user) => {
    const category = must(await as.client.from("categories").insert({ name: `Avulso ${crypto.randomUUID()}` }).select("id").single());
    return must(
      await as.client
        .from("card_purchases")
        .insert({ name: "Compra", amount_cents, bank_id: bankId, category_id: category.id })
        .select("id")
        .single(),
    ).id;
  };

  beforeAll(async () => {
    [user, other] = await Promise.all([createTestUser(), createTestUser()]);
  });

  afterAll(async () => {
    await Promise.all([user.remove(), other.remove()]);
  });

  test("spec example: unchecking a recurring item; installment decrements", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "Nubank", [
      { name: "A", amount_cents: 3000 },
      { name: "B", amount_cents: 5000 },
      { name: "Notebook", amount_cents: 10000, remaining_months: 3 },
    ]);

    const { data: paymentId, error } = await payCard(bankId, [
      { card_item_id: ids.A, included: false },
      { card_item_id: ids.B, included: true },
      { card_item_id: ids.Notebook, included: true },
    ]);
    expect(error).toBeNull();

    const { data: payment } = await user.client.from("payments").select("kind, total_cents").eq("id", paymentId!).single();
    expect(payment).toEqual({ kind: "card", total_cents: 15000 });

    const { data: paymentItems } = await user.client
      .from("payment_items")
      .select("card_item_id, included, amount_cents")
      .eq("payment_id", paymentId!);
    expect(paymentItems).toHaveLength(3);
    expect(paymentItems).toContainEqual({ card_item_id: ids.A, included: false, amount_cents: 3000 });

    expect(await getItem(ids.Notebook)).toMatchObject({ remaining_months: 2, ended_at: null });
    expect(await getItem(ids.A)).toMatchObject({ status: "active" });
  });

  test("installment cannot be excluded", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "Itaú", [
      { name: "Geladeira", amount_cents: 20000, remaining_months: 5 },
    ]);

    const { data: paymentId } = await payCard(bankId, [{ card_item_id: ids.Geladeira, included: false }]);
    const { data: payment } = await user.client.from("payments").select("total_cents").eq("id", paymentId!).single();
    expect(payment?.total_cents).toBe(20000);
  });

  test("pausing an excluded recurring item", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "Inter", [
      { name: "Spotify", amount_cents: 2190 },
      { name: "Netflix", amount_cents: 5590 },
    ]);

    await payCard(bankId, [
      { card_item_id: ids.Spotify, included: false, pause: true },
      { card_item_id: ids.Netflix, included: true },
    ]);
    expect(await getItem(ids.Spotify)).toMatchObject({ status: "paused" });
  });

  test("including a paused item reactivates it", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "C6", [{ name: "Disney", amount_cents: 3390, status: "paused" }]);

    await payCard(bankId, [{ card_item_id: ids.Disney, included: true }]);
    expect(await getItem(ids.Disney)).toMatchObject({ status: "active" });
  });

  test("installment paid on its last month is ended", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "Santander", [
      { name: "Celular", amount_cents: 15000, remaining_months: 1 },
    ]);

    await payCard(bankId, [{ card_item_id: ids.Celular, included: true }]);
    const item = await getItem(ids.Celular);
    expect(item.remaining_months).toBe(0);
    expect(item.ended_at).not.toBeNull();
  });

  test("requires at least one included item", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "BB", [{ name: "Jornal", amount_cents: 1000 }]);

    const { error } = await payCard(bankId, [{ card_item_id: ids.Jornal, included: false }]);
    expect(error).toMatchObject({ code: "P0001", message: "Selecione ao menos um item." });
  });

  test("second payment of the same bank in the month fails", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "XP", [{ name: "Seguro", amount_cents: 4000 }]);
    await payCard(bankId, [{ card_item_id: ids.Seguro, included: true }]);

    const { error } = await payCard(bankId, [{ card_item_id: ids.Seguro, included: true }]);
    expect(error).toMatchObject({ code: "P0001", message: "Este pagamento já foi registrado." });
  });

  test("user cannot pay another user's bank", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "Safra", [{ name: "Revista", amount_cents: 1500 }]);

    const { error } = await payCard(bankId, [{ card_item_id: ids.Revista, included: true }], other);
    expect(error).toMatchObject({ code: "P0001", message: "Banco não encontrado." });
  });

  test("ignores items from another bank, another user or already ended", async () => {
    const own = await seedBankWithItems(user, "Original", [{ name: "Própria", amount_cents: 1000 }]);
    const sibling = await seedBankWithItems(user, "Vizinho", [{ name: "Do vizinho", amount_cents: 7000 }]);
    const foreign = await seedBankWithItems(other, "Alheio", [{ name: "Alheia", amount_cents: 9000 }]);
    const ended = await seedBankWithItems(user, "Encerrado", [{ name: "Antiga", amount_cents: 3000 }]);
    await user.client.from("card_items").update({ ended_at: new Date().toISOString() }).eq("id", ended.ids.Antiga);

    const { data: paymentId, error } = await payCard(own.bankId, [
      { card_item_id: own.ids["Própria"], included: true },
      { card_item_id: sibling.ids["Do vizinho"], included: true },
      { card_item_id: foreign.ids.Alheia, included: true },
      { card_item_id: ended.ids.Antiga, included: true },
    ]);
    expect(error).toBeNull();

    const { data: payment } = await user.client.from("payments").select("total_cents").eq("id", paymentId!).single();
    expect(payment?.total_cents).toBe(1000);

    const { data: paymentItems } = await user.client.from("payment_items").select("card_item_id").eq("payment_id", paymentId!);
    expect(paymentItems).toEqual([{ card_item_id: own.ids["Própria"] }]);
  });

  test("user cannot read another user's payment items", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "Privado", [{ name: "Item", amount_cents: 1000 }]);
    await payCard(bankId, [{ card_item_id: ids.Item, included: true }]);

    const { data } = await other.client.from("payment_items").select("id").eq("user_id", user.userId);
    expect(data).toEqual([]);
  });

  test("internal security definer helpers are not callable by users", async () => {
    const { bankId } = await seedBankWithItems(user, "Interno", [{ name: "Item", amount_cents: 1000 }]);

    const { error: insertError } = await other.client.rpc("insert_payment", {
      p_user_id: user.userId,
      p_kind: "card",
      p_bill_id: crypto.randomUUID(),
      p_bank_id: bankId,
      p_total_cents: 1,
    });
    expect(insertError?.code).toBe("42501");

    const { error: selectionError } = await other.client.rpc("card_selection", {
      p_user_id: user.userId,
      p_bank_id: bankId,
      p_items: [],
    });
    expect(selectionError?.code).toBe("42501");
  });

  describe("card purchases", () => {
    test("total includes the bank's purchases of the month", async () => {
      const { bankId, ids } = await seedBankWithItems(user, "Avulsos", [
        { name: "Netflix", amount_cents: 5000 },
        { name: "Spotify", amount_cents: 2000 },
      ]);
      await addPurchase(bankId, 3000);
      await addPurchase(bankId, 1500);

      const { data: paymentId, error } = await payCard(bankId, [
        { card_item_id: ids.Netflix, included: true },
        { card_item_id: ids.Spotify, included: false },
      ]);
      expect(error).toBeNull();
      expect(await getTotal(paymentId!)).toBe(9500);
    });

    test("bank with only purchases can be paid", async () => {
      const { bankId } = await seedBankWithItems(user, "Só avulsos", []);
      await addPurchase(bankId, 8000);

      const { data: paymentId, error } = await payCard(bankId, []);
      expect(error).toBeNull();
      expect(await getTotal(paymentId!)).toBe(8000);
    });

    test("bank without included items nor purchases cannot be paid", async () => {
      const { bankId } = await seedBankWithItems(user, "Vazio", []);

      const { error } = await payCard(bankId, []);
      expect(error).toMatchObject({ code: "P0001", message: "Selecione ao menos um item." });
    });

    test("ignores purchases from another bank, another month or another user", async () => {
      const own = await seedBankWithItems(user, "Próprio", [{ name: "Item", amount_cents: 1000 }]);
      const sibling = await seedBankWithItems(user, "Irmão", []);
      const foreign = await seedBankWithItems(other, "Estranho", []);
      await addPurchase(sibling.bankId, 7000);
      await addPurchase(foreign.bankId, 9000, other);
      const category = must(await user.client.from("categories").insert({ name: "Antigo" }).select("id").single());
      must(
        await admin
          .from("card_purchases")
          .insert({
            user_id: user.userId,
            month: previousMonth(),
            name: "Mês passado",
            amount_cents: 3000,
            bank_id: own.bankId,
            category_id: category.id,
          })
          .select("id")
          .single(),
      );

      const { data: paymentId, error } = await payCard(own.bankId, [{ card_item_id: own.ids.Item, included: true }]);
      expect(error).toBeNull();
      expect(await getTotal(paymentId!)).toBe(1000);
    });

    test("undoing the payment reopens the bank's purchases", async () => {
      const { bankId } = await seedBankWithItems(user, "Reaberto", []);
      const purchaseId = await addPurchase(bankId, 4000);
      const { data: paymentId } = await payCard(bankId, []);

      const { error: lockedError } = await user.client.from("card_purchases").update({ amount_cents: 1 }).eq("id", purchaseId);
      expect(lockedError?.code).toBe("P0001");

      const { error: undoError } = await user.client.rpc("undo_payment", { p_payment_id: paymentId! });
      expect(undoError).toBeNull();

      const { error: updateError } = await user.client
        .from("card_purchases")
        .update({ amount_cents: 4500 })
        .eq("id", purchaseId);
      expect(updateError).toBeNull();

      const { error: deleteError } = await user.client.from("card_purchases").delete().eq("id", purchaseId);
      expect(deleteError).toBeNull();
    });
  });
});
