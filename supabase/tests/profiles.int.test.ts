import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { currentMonth } from "@/shared/utils/month";

import { createTestUser } from "./helpers";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

describe("complete_onboarding", () => {
  let userA: TestUser;
  let userB: TestUser;

  beforeAll(async () => {
    [userA, userB] = await Promise.all([createTestUser(), createTestUser()]);
  });

  afterAll(async () => {
    await Promise.all([userA.remove(), userB.remove()]);
  });

  test("creates profile and salary effective from current month", async () => {
    const { error } = await userA.client.rpc("complete_onboarding", { p_name: "  Igor  ", p_amount_cents: 500000 });
    expect(error).toBeNull();

    const { data: profile } = await userA.client.from("profiles").select("name").single();
    expect(profile?.name).toBe("Igor");

    const { data: salaries } = await userA.client.from("salaries").select("amount_cents, effective_month");
    expect(salaries).toEqual([{ amount_cents: 500000, effective_month: currentMonth() }]);
  });

  test("fails when onboarding was already completed", async () => {
    const { error } = await userA.client.rpc("complete_onboarding", { p_name: "Outro", p_amount_cents: 100 });
    expect(error?.code).toBe("P0001");
    expect(error?.message).toBe("Onboarding já concluído.");
  });

  test("rejects salary less than or equal to zero", async () => {
    const { error } = await userB.client.rpc("complete_onboarding", { p_name: "Bea", p_amount_cents: 0 });
    expect(error).not.toBeNull();

    const { data: profile } = await userB.client.from("profiles").select("id").maybeSingle();
    expect(profile).toBeNull();
  });

  test("user cannot read another user's profile or salaries", async () => {
    const { data: profiles } = await userB.client.from("profiles").select("id").eq("id", userA.userId);
    expect(profiles).toEqual([]);

    const { data: salaries } = await userB.client.from("salaries").select("id").eq("user_id", userA.userId);
    expect(salaries).toEqual([]);
  });
});
