import { describe, expect, test } from "vitest";

import { cardItemSchema, cardItemUpdateSchema } from "./card-item";

const base = {
  name: " Netflix ",
  categoryId: crypto.randomUUID(),
  bankId: crypto.randomUUID(),
  amount: "R$ 55,90",
};

describe("cardItemSchema", () => {
  test("always recurring → remainingMonths null, ignoring months", () => {
    expect(cardItemSchema.parse({ ...base, alwaysRecurring: "on", remainingMonths: "4" })).toEqual({
      name: "Netflix",
      categoryId: base.categoryId,
      bankId: base.bankId,
      amount: 5590,
      remainingMonths: null,
    });
  });

  test("installment → remainingMonths as integer", () => {
    expect(cardItemSchema.parse({ ...base, remainingMonths: "3" }).remainingMonths).toBe(3);
  });

  test.each(["", "0", "1.5", "abc"])("installment with months %j is invalid", (remainingMonths) => {
    const result = cardItemSchema.safeParse({ ...base, remainingMonths });
    expect(result.error?.issues[0]).toMatchObject({
      path: ["remainingMonths"],
      message: "Informe os meses restantes (mínimo 1)",
    });
  });

  test("bank is required", () => {
    const result = cardItemSchema.safeParse({ ...base, bankId: "", alwaysRecurring: "on" });
    expect(result.error?.issues[0]).toMatchObject({ path: ["bankId"], message: "Selecione um banco" });
  });
});

describe("cardItemUpdateSchema", () => {
  test("keeps id", () => {
    const id = crypto.randomUUID();
    expect(cardItemUpdateSchema.parse({ ...base, id, alwaysRecurring: "on" }).id).toBe(id);
  });
});

test("rejects names longer than 100 characters", () => {
  expect(cardItemSchema.safeParse({ ...base, name: "x".repeat(101), alwaysRecurring: "on" }).error?.issues[0].path).toEqual(["name"]);
});
