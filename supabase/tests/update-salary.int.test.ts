import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { currentMonth } from "@/shared/utils/month";

import { admin, createTestUser } from "./helpers";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

const previousMonth = () => {
  const [year, month] = currentMonth().split("-").map(Number);
  return new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10);
};

describe("update_salary", () => {
  let user: TestUser;

  const salaries = async () =>
    (await user.client.from("salaries").select("amount_cents, effective_month").order("effective_month")).data;

  beforeAll(async () => {
    user = await createTestUser();
    await user.client.rpc("complete_onboarding", { p_name: "Igor", p_amount_cents: 500000 });
    await admin
      .from("salaries")
      .insert({ user_id: user.userId, amount_cents: 400000, effective_month: previousMonth() });
  });

  afterAll(async () => {
    await user.remove();
  });

  test("updates current month salary and preserves previous months", async () => {
    const { error } = await user.client.rpc("update_salary", { p_amount_cents: 550000 });
    expect(error).toBeNull();

    expect(await salaries()).toEqual([
      { amount_cents: 400000, effective_month: previousMonth() },
      { amount_cents: 550000, effective_month: currentMonth() },
    ]);
  });

  test("rejects amount less than or equal to zero", async () => {
    const { error } = await user.client.rpc("update_salary", { p_amount_cents: 0 });
    expect(error).toMatchObject({ code: "P0001", message: "Informe um valor maior que zero." });
  });

  test("salaries cannot be written directly", async () => {
    const { data } = await user.client
      .from("salaries")
      .update({ amount_cents: 1 })
      .eq("effective_month", currentMonth())
      .select();
    expect(data ?? []).toEqual([]);

    const { error } = await user.client
      .from("salaries")
      .insert({ user_id: user.userId, amount_cents: 1, effective_month: "2030-01-01" });
    expect(error?.code).toBe("42501");
  });

  test("fails when there is a payment in the current month", async () => {
    const { data: category } = await user.client.from("categories").insert({ name: "Casa" }).select("id").single();
    const { data: bill } = await user.client
      .from("bills")
      .insert({ name: "Internet", category_id: category!.id, value_mode: "fixed", amount_cents: 12000 })
      .select("id")
      .single();
    await user.client.rpc("pay_bill", { p_bill_id: bill!.id });

    const { error } = await user.client.rpc("update_salary", { p_amount_cents: 600000 });
    expect(error).toMatchObject({
      code: "P0001",
      message: "Desfaça os pagamentos do mês para alterar o salário.",
    });
    expect((await salaries())?.at(-1)?.amount_cents).toBe(550000);
  });
});
