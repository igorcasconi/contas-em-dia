import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { type TestUser, createTestUser, must } from "./helpers";

describe.each(["categories", "banks"] as const)("%s", (table) => {
  let userA: TestUser;
  let userB: TestUser;

  beforeAll(async () => {
    [userA, userB] = await Promise.all([createTestUser(), createTestUser()]);
    must(await userA.client.from(table).insert({ name: "Internet" }).select());
  });

  afterAll(async () => {
    await Promise.all([userA.remove(), userB.remove()]);
  });

  test("lists own records", async () => {
    const { data } = await userA.client.from(table).select("name");
    expect(data).toEqual([{ name: "Internet" }]);
  });

  test("rejects duplicated name ignoring case", async () => {
    const { error } = await userA.client.from(table).insert({ name: "INTERNET" });
    expect(error?.code).toBe("23505");
  });

  test("rejects names longer than 100 characters", async () => {
    const { error } = await userA.client.from(table).insert({ name: "x".repeat(101) });
    expect(error?.code).toBe("23514");
  });

  test("allows the same name for another user", async () => {
    const { error } = await userB.client.from(table).insert({ name: "Internet" });
    expect(error).toBeNull();
  });

  test("user cannot read, update or delete another user's records", async () => {
    const { data: visible } = await userB.client.from(table).select("name").eq("user_id", userA.userId);
    expect(visible).toEqual([]);

    const { data: updated } = await userB.client
      .from(table)
      .update({ name: "Hack" })
      .eq("user_id", userA.userId)
      .select();
    expect(updated).toEqual([]);

    const { data: deleted } = await userB.client.from(table).delete().eq("user_id", userA.userId).select();
    expect(deleted).toEqual([]);
  });
});
