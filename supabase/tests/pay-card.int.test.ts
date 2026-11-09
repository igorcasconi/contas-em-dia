import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { type CardSelection, seedBankWithItems } from "./card-fixtures";
import { createTestUser } from "./helpers";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

describe("pay_card", () => {
  let user: TestUser;
  let other: TestUser;

  const payCard = (bankId: string, items: CardSelection[], as: TestUser = user) =>
    as.client.rpc("pay_card", { p_bank_id: bankId, p_items: items });

  const getItem = async (id: string) =>
    (await user.client.from("card_items").select("status, remaining_months, ended_at").eq("id", id).single()).data!;

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
});
