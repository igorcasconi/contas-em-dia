import { describe, expect, test } from "vitest";

import { cardPurchaseSchema, cardPurchaseUpdateSchema } from "./card-purchase";

const base = {
  name: " Mercado ",
  categoryId: crypto.randomUUID(),
  bankId: crypto.randomUUID(),
  amount: "R$ 120,50",
};

const firstIssue = (input: Record<string, unknown>) => cardPurchaseSchema.safeParse(input).error?.issues[0];

describe("cardPurchaseSchema", () => {
  test("valid → trims name and converts amount to cents", () => {
    expect(cardPurchaseSchema.parse(base)).toEqual({
      name: "Mercado",
      categoryId: base.categoryId,
      bankId: base.bankId,
      amount: 12050,
    });
  });

  test("minimum amount R$ 0,01 → 1 cent", () => {
    expect(cardPurchaseSchema.parse({ ...base, amount: "R$ 0,01" }).amount).toBe(1);
  });

  test.each(["", "   "])("name %j is required", (name) => {
    expect(firstIssue({ ...base, name })).toMatchObject({ path: ["name"], message: "Informe a descrição" });
  });

  test("rejects names longer than 100 characters", () => {
    expect(firstIssue({ ...base, name: "x".repeat(101) })).toMatchObject({
      path: ["name"],
      message: "Use no máximo 100 caracteres",
    });
  });

  test("bank is required", () => {
    expect(firstIssue({ ...base, bankId: "" })).toMatchObject({ path: ["bankId"], message: "Selecione um banco" });
  });

  test("category is required", () => {
    expect(firstIssue({ ...base, categoryId: "" })).toMatchObject({ path: ["categoryId"], message: "Selecione um tipo" });
  });

  test.each(["", "R$ 0,00"])("amount %j is invalid", (amount) => {
    expect(firstIssue({ ...base, amount })?.path).toEqual(["amount"]);
  });
});

describe("cardPurchaseUpdateSchema", () => {
  test("keeps id", () => {
    const id = crypto.randomUUID();
    expect(cardPurchaseUpdateSchema.parse({ ...base, id }).id).toBe(id);
  });

  test("requires uuid id", () => {
    expect(cardPurchaseUpdateSchema.safeParse({ ...base, id: "abc" }).error?.issues[0].path).toEqual(["id"]);
  });
});
