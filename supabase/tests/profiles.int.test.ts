import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { currentMonth } from "@/shared/utils/month";

import { type TestUser, createTestUser } from "./helpers";

describe("complete_onboarding", () => {
  const users: TestUser[] = [];
  const newUser = async () => {
    const user = await createTestUser();
    users.push(user);
    return user;
  };

  let other: TestUser;

  beforeAll(async () => {
    other = await newUser();
    await other.client.rpc("complete_onboarding", { p_name: "Outro", p_amount_cents: 100 });
  });

  afterAll(async () => {
    await Promise.all(users.map((user) => user.remove()));
  });

  test("creates profile and salary effective from current month", async () => {
    const user = await newUser();
    const { error } = await user.client.rpc("complete_onboarding", { p_name: "  Igor  ", p_amount_cents: 500000 });
    expect(error).toBeNull();

    const { data: profile } = await user.client.from("profiles").select("name").single();
    expect(profile?.name).toBe("Igor");

    const { data: salaries } = await user.client.from("salaries").select("amount_cents, effective_month");
    expect(salaries).toEqual([{ amount_cents: 500000, effective_month: currentMonth() }]);
  });

  test("fails when onboarding was already completed", async () => {
    const user = await newUser();
    await user.client.rpc("complete_onboarding", { p_name: "Igor", p_amount_cents: 500000 });

    const { error } = await user.client.rpc("complete_onboarding", { p_name: "Outro", p_amount_cents: 100 });
    expect(error).toMatchObject({ code: "P0001", message: "Onboarding já concluído." });
  });

  test.each([
    { name: "Bea", amount: 0 },
    { name: "   ", amount: 100 },
  ])("rejects invalid data $name / $amount without creating profile", async ({ name, amount }) => {
    const user = await newUser();

    const { error } = await user.client.rpc("complete_onboarding", { p_name: name, p_amount_cents: amount });
    expect(error?.code).toBe("23514");

    const { data: profile } = await user.client.from("profiles").select("id").maybeSingle();
    expect(profile).toBeNull();
  });

  test("profile cannot be created directly, only through rpc", async () => {
    const user = await newUser();

    const { error } = await user.client.from("profiles").insert({ id: user.userId, name: "Atalho" });
    expect(error?.code).toBe("42501");
  });

  test("user cannot read another user's profile or salaries", async () => {
    const user = await newUser();

    const { data: profiles } = await user.client.from("profiles").select("id").eq("id", other.userId);
    expect(profiles).toEqual([]);

    const { data: salaries } = await user.client.from("salaries").select("id").eq("user_id", other.userId);
    expect(salaries).toEqual([]);
  });
});
