import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { currentMonth } from "@/shared/utils/month";

import { createTestUser } from "./helpers";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

describe("pay_bill", () => {
  let userA: TestUser;
  let userB: TestUser;
  let categoryId: string;

  const createBill = async (bill: { name: string; value_mode: string; amount_cents?: number }) => {
    const { data } = await userA.client
      .from("bills")
      .insert({ ...bill, category_id: categoryId })
      .select("id")
      .single();
    return data!.id;
  };

  beforeAll(async () => {
    [userA, userB] = await Promise.all([createTestUser(), createTestUser()]);
    const { data } = await userA.client.from("categories").insert({ name: "Casa" }).select("id").single();
    categoryId = data!.id;
  });

  afterAll(async () => {
    await Promise.all([userA.remove(), userB.remove()]);
  });

  test("fixed bill uses registered amount, ignoring input", async () => {
    const billId = await createBill({ name: "Internet", value_mode: "fixed", amount_cents: 12000 });

    const { data: paymentId, error } = await userA.client.rpc("pay_bill", { p_bill_id: billId, p_amount_cents: 1 });
    expect(error).toBeNull();

    const { data: payment } = await userA.client.from("payments").select("*").eq("id", paymentId!).single();
    expect(payment).toMatchObject({ kind: "bill", bill_id: billId, total_cents: 12000, month: currentMonth() });
  });

  test("variable bill requires amount greater than zero", async () => {
    const billId = await createBill({ name: "Energia", value_mode: "variable" });

    for (const amount of [undefined, 0]) {
      const { error } = await userA.client.rpc("pay_bill", { p_bill_id: billId, p_amount_cents: amount });
      expect(error).toMatchObject({ code: "P0001", message: "Informe um valor maior que zero." });
    }

    const { data: paymentId } = await userA.client.rpc("pay_bill", { p_bill_id: billId, p_amount_cents: 18745 });
    const { data: payment } = await userA.client.from("payments").select("total_cents").eq("id", paymentId!).single();
    expect(payment?.total_cents).toBe(18745);
  });

  test("second payment of the same bill in the month fails", async () => {
    const billId = await createBill({ name: "Telefone", value_mode: "fixed", amount_cents: 5000 });
    await userA.client.rpc("pay_bill", { p_bill_id: billId });

    const { error } = await userA.client.rpc("pay_bill", { p_bill_id: billId });
    expect(error).toMatchObject({ code: "P0001", message: "Este pagamento já foi registrado." });
  });

  test("ended bill cannot be paid", async () => {
    const billId = await createBill({ name: "Antigo", value_mode: "fixed", amount_cents: 100 });
    await userA.client.from("bills").update({ ended_at: new Date().toISOString() }).eq("id", billId);

    const { error } = await userA.client.rpc("pay_bill", { p_bill_id: billId });
    expect(error).toMatchObject({ code: "P0001", message: "Boleto não encontrado." });
  });

  test("user cannot pay or read another user's bills and payments", async () => {
    const billId = await createBill({ name: "Água", value_mode: "fixed", amount_cents: 7000 });

    const { error } = await userB.client.rpc("pay_bill", { p_bill_id: billId });
    expect(error).toMatchObject({ code: "P0001", message: "Boleto não encontrado." });

    const { data: payments } = await userB.client.from("payments").select("id");
    expect(payments).toEqual([]);
  });

  test("payments cannot be written directly, only through rpc", async () => {
    const billId = await createBill({ name: "Gás", value_mode: "fixed", amount_cents: 9000 });

    const { error } = await userA.client
      .from("payments")
      .insert({ user_id: userA.userId, month: currentMonth(), kind: "bill", bill_id: billId, total_cents: 1 });
    expect(error?.code).toBe("42501");
  });
});
