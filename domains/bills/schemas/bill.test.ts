import { describe, expect, test } from "vitest";

import { billSchema, billUpdateSchema } from "./bill";

const categoryId = crypto.randomUUID();

describe("billSchema", () => {
  test("fixed bill requires amount in cents", () => {
    expect(billSchema.parse({ name: " Internet ", categoryId, valueMode: "fixed", amount: "R$ 120,00" })).toEqual({
      name: "Internet",
      categoryId,
      valueMode: "fixed",
      amount: 12000,
    });
  });

  test("fixed bill without amount is invalid", () => {
    const result = billSchema.safeParse({ name: "Internet", categoryId, valueMode: "fixed", amount: "" });
    expect(result.error?.issues[0].path).toEqual(["amount"]);
  });

  test("variable bill ignores amount", () => {
    expect(billSchema.parse({ name: "Energia", categoryId, valueMode: "variable", amount: "R$ 99,00" })).toEqual({
      name: "Energia",
      categoryId,
      valueMode: "variable",
    });
  });

  test("category is required", () => {
    const result = billSchema.safeParse({ name: "Energia", categoryId: "", valueMode: "variable" });
    expect(result.error?.issues[0]).toMatchObject({ path: ["categoryId"], message: "Selecione um tipo" });
  });

  test("value mode is required", () => {
    const result = billSchema.safeParse({ name: "Energia", categoryId });
    expect(result.error?.issues[0].path).toEqual(["valueMode"]);
  });
});

describe("billUpdateSchema", () => {
  test("requires id", () => {
    const result = billUpdateSchema.safeParse({ name: "Energia", categoryId, valueMode: "variable" });
    expect(result.error?.issues[0].path).toEqual(["id"]);
  });
});

test("rejects names longer than 100 characters", () => {
  expect(billSchema.safeParse({ name: "x".repeat(101), categoryId, valueMode: "variable" }).error?.issues[0].path).toEqual(["name"]);
});
