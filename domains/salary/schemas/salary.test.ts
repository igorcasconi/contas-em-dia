import { describe, expect, test } from "vitest";

import { salarySchema } from "./salary";

describe("salarySchema", () => {
  test("accepts positive integer cents", () => {
    expect(salarySchema.parse({ amountCents: 550000 })).toEqual({ amountCents: 550000 });
  });

  test.each([0, -1, 10.5])("rejects %d", (amountCents) => {
    expect(salarySchema.safeParse({ amountCents }).success).toBe(false);
  });
});
