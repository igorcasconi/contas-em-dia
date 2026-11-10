import { describe, expect, test } from "vitest";

import { payBillSchema, payCardSchema } from "./payment";

const id = () => crypto.randomUUID();

describe("payBillSchema", () => {
  test("fixed bill payment has no amount", () => {
    const billId = id();
    expect(payBillSchema.parse({ billId })).toEqual({ billId });
  });

  test("variable bill payment amount in cents", () => {
    expect(payBillSchema.parse({ billId: id(), amount: "R$ 187,45" }).amount).toBe(18745);
  });

  test("empty amount is invalid", () => {
    expect(payBillSchema.safeParse({ billId: id(), amount: "" }).error?.issues[0].path).toEqual(["amount"]);
  });

  test("bill is required", () => {
    expect(payBillSchema.safeParse({ billId: "" }).error?.issues[0]).toMatchObject({
      path: ["billId"],
      message: "Selecione o boleto",
    });
  });
});

describe("payCardSchema", () => {
  test("pause defaults to false", () => {
    const cardItemId = id();
    expect(payCardSchema.parse({ bankId: id(), items: [{ cardItemId, included: true }] }).items).toEqual([
      { cardItemId, included: true, pause: false },
    ]);
  });

  test("accepts empty items (bank with only card purchases; rule enforced by pay_card)", () => {
    expect(payCardSchema.safeParse({ bankId: id(), items: [] }).success).toBe(true);
  });
});
