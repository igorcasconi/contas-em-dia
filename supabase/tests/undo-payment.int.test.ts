import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { type CardSelection, seedBankWithItems } from "./card-fixtures";
import { type TestUser, admin, createTestUser, previousMonth } from "./helpers";

describe("undo_payment", () => {
  let user: TestUser;
  let other: TestUser;

  const payCard = async (bankId: string, items: CardSelection[]) =>
    (await user.client.rpc("pay_card", { p_bank_id: bankId, p_items: items })).data!;

  const undo = (paymentId: string, as: TestUser = user) => as.client.rpc("undo_payment", { p_payment_id: paymentId });

  const getItem = async (id: string) =>
    (await user.client.from("card_items").select("status, remaining_months, ended_at").eq("id", id).single()).data!;

  beforeAll(async () => {
    [user, other] = await Promise.all([createTestUser(), createTestUser()]);
  });

  afterAll(async () => {
    await Promise.all([user.remove(), other.remove()]);
  });

  test("undoing a bill payment allows paying again", async () => {
    const { data: category } = await user.client.from("categories").insert({ name: "Casa" }).select("id").single();
    const { data: bill } = await user.client
      .from("bills")
      .insert({ name: "Internet", category_id: category!.id, value_mode: "fixed", amount_cents: 12000 })
      .select("id")
      .single();
    const { data: paymentId } = await user.client.rpc("pay_bill", { p_bill_id: bill!.id });

    const { error } = await undo(paymentId!);
    expect(error).toBeNull();

    const { data: payments } = await user.client.from("payments").select("id").eq("id", paymentId!);
    expect(payments).toEqual([]);

    const { error: payAgainError } = await user.client.rpc("pay_bill", { p_bill_id: bill!.id });
    expect(payAgainError).toBeNull();
  });

  test("undoing a card payment restores installments and reopens ended item", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "Nubank", [
      { name: "Notebook", amount_cents: 10000, remaining_months: 3 },
      { name: "Celular", amount_cents: 5000, remaining_months: 1 },
    ]);
    const paymentId = await payCard(bankId, [
      { card_item_id: ids.Notebook, included: true },
      { card_item_id: ids.Celular, included: true },
    ]);

    await undo(paymentId);

    expect(await getItem(ids.Notebook)).toEqual({ status: "active", remaining_months: 3, ended_at: null });
    expect(await getItem(ids.Celular)).toEqual({ status: "active", remaining_months: 1, ended_at: null });
  });

  test("undo reverts a pause", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "Inter", [
      { name: "Spotify", amount_cents: 2190 },
      { name: "Netflix", amount_cents: 5590 },
    ]);
    const paymentId = await payCard(bankId, [
      { card_item_id: ids.Spotify, included: false, pause: true },
      { card_item_id: ids.Netflix, included: true },
    ]);

    await undo(paymentId);
    expect(await getItem(ids.Spotify)).toMatchObject({ status: "active" });
  });

  test("undo restores paused state of a reactivated item", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "C6", [{ name: "Disney", amount_cents: 3390, status: "paused" }]);
    const paymentId = await payCard(bankId, [{ card_item_id: ids.Disney, included: true }]);

    await undo(paymentId);
    expect(await getItem(ids.Disney)).toMatchObject({ status: "paused" });
  });

  test("payment from a previous month cannot be undone", async () => {
    const { bankId } = await seedBankWithItems(user, "Itaú", [{ name: "Seguro", amount_cents: 4000 }]);
    const { data: payment } = await admin
      .from("payments")
      .insert({ user_id: user.userId, month: previousMonth(), kind: "card", bank_id: bankId, total_cents: 4000 })
      .select("id")
      .single();

    const { error } = await undo(payment!.id);
    expect(error).toMatchObject({ code: "P0001", message: "Só é possível desfazer pagamentos do mês atual." });
  });

  test("user cannot undo another user's payment", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "XP", [{ name: "Jornal", amount_cents: 1000 }]);
    const paymentId = await payCard(bankId, [{ card_item_id: ids.Jornal, included: true }]);

    const { error } = await undo(paymentId, other);
    expect(error).toMatchObject({ code: "P0001", message: "Pagamento não encontrado." });
  });

  test("undo does not resurrect an item removed after the payment", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "Removido", [
      { name: "Netflix", amount_cents: 5590 },
      { name: "Spotify", amount_cents: 2190 },
    ]);
    const paymentId = await payCard(bankId, [
      { card_item_id: ids.Netflix, included: true },
      { card_item_id: ids.Spotify, included: true },
    ]);
    await user.client.from("card_items").update({ ended_at: new Date().toISOString() }).eq("id", ids.Spotify);

    await undo(paymentId);

    expect((await getItem(ids.Spotify)).ended_at).not.toBeNull();
    expect(await getItem(ids.Netflix)).toMatchObject({ status: "active", ended_at: null });
  });

  test("undo keeps installment edits made after the payment", async () => {
    const { bankId, ids } = await seedBankWithItems(user, "Editado", [
      { name: "TV", amount_cents: 30000, remaining_months: 3 },
    ]);
    const paymentId = await payCard(bankId, [{ card_item_id: ids.TV, included: true }]);
    await user.client.from("card_items").update({ remaining_months: 6 }).eq("id", ids.TV);

    await undo(paymentId);
    expect((await getItem(ids.TV)).remaining_months).toBe(6);
  });
});
