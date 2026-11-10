import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { type TestUser, createTestUser, must } from "./helpers";

describe("bills and card_items", () => {
  let userA: TestUser;
  let userB: TestUser;
  let a: { categoryId: string; bankId: string };

  beforeAll(async () => {
    [userA, userB] = await Promise.all([createTestUser(), createTestUser()]);
    const category = must(await userA.client.from("categories").insert({ name: "Serviços" }).select("id").single());
    const bank = must(await userA.client.from("banks").insert({ name: "Nubank" }).select("id").single());
    a = { categoryId: category.id, bankId: bank.id };

    must(
      await userA.client
        .from("bills")
        .insert({ name: "Base", category_id: a.categoryId, value_mode: "variable" })
        .select(),
    );
    must(
      await userA.client
        .from("card_items")
        .insert({ name: "Base", bank_id: a.bankId, category_id: a.categoryId, amount_cents: 100, status: "active" })
        .select(),
    );
  });

  afterAll(async () => {
    await Promise.all([userA.remove(), userB.remove()]);
  });

  describe("bills", () => {
    test("accepts fixed with amount and variable without amount", async () => {
      const { error } = await userA.client.from("bills").insert([
        { name: "Internet", category_id: a.categoryId, value_mode: "fixed", amount_cents: 12000 },
        { name: "Energia", category_id: a.categoryId, value_mode: "variable" },
      ]);
      expect(error).toBeNull();
    });

    test("rejects fixed without amount", async () => {
      const { error } = await userA.client
        .from("bills")
        .insert({ name: "X", category_id: a.categoryId, value_mode: "fixed" });
      expect(error?.code).toBe("23514");
    });

    test("rejects variable with amount", async () => {
      const { error } = await userA.client
        .from("bills")
        .insert({ name: "X", category_id: a.categoryId, value_mode: "variable", amount_cents: 100 });
      expect(error?.code).toBe("23514");
    });
  });

  describe("card_items", () => {
    test("accepts recurring and installment items", async () => {
      const { error } = await userA.client.from("card_items").insert([
        { name: "Netflix", bank_id: a.bankId, category_id: a.categoryId, amount_cents: 5590, status: "active" },
        {
          name: "Notebook",
          bank_id: a.bankId,
          category_id: a.categoryId,
          amount_cents: 40220,
          remaining_months: 3,
          status: "active",
        },
      ]);
      expect(error).toBeNull();
    });

    test("rejects paused installment item", async () => {
      const { error } = await userA.client.from("card_items").insert({
        name: "X",
        bank_id: a.bankId,
        category_id: a.categoryId,
        amount_cents: 100,
        remaining_months: 2,
        status: "paused",
      });
      expect(error?.code).toBe("23514");
    });
  });

  test("blocks deleting category or bank in use", async () => {
    const { error: categoryError } = await userA.client.from("categories").delete().eq("id", a.categoryId);
    expect(categoryError?.code).toBe("23503");

    const { error: bankError } = await userA.client.from("banks").delete().eq("id", a.bankId);
    expect(bankError?.code).toBe("23503");
  });

  test("user cannot reference another user's category or bank", async () => {
    const { error: billError } = await userB.client
      .from("bills")
      .insert({ name: "X", category_id: a.categoryId, value_mode: "variable" });
    expect(billError?.code).toBe("23503");

    const { error: itemError } = await userB.client
      .from("card_items")
      .insert({ name: "X", bank_id: a.bankId, category_id: a.categoryId, amount_cents: 100 });
    expect(itemError?.code).toBe("23503");
  });

  test("user cannot read or update another user's recurrences", async () => {
    const { data: bills } = await userB.client.from("bills").select("id");
    const { data: items } = await userB.client.from("card_items").select("id");
    expect(bills).toEqual([]);
    expect(items).toEqual([]);

    const endedAt = new Date().toISOString();
    const { data: endedBills } = await userB.client
      .from("bills")
      .update({ ended_at: endedAt })
      .eq("user_id", userA.userId)
      .select();
    const { data: endedItems } = await userB.client
      .from("card_items")
      .update({ ended_at: endedAt })
      .eq("user_id", userA.userId)
      .select();
    expect(endedBills).toEqual([]);
    expect(endedItems).toEqual([]);

    const { data: stillOpen } = await userA.client.from("bills").select("id").is("ended_at", null);
    expect(stillOpen?.length).toBeGreaterThan(0);
  });
});
