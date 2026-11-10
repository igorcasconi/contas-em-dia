import { describe, expect, test } from "vitest";

import { computeLeftover } from "./compute-leftover";

describe("computeLeftover", () => {
  test.each([
    [500000, 120000, 380000],
    [500000, 500000, 0],
    [500000, 650000, -150000],
  ])("salary %i − paid %i = %i", (salary, paid, expected) => {
    expect(computeLeftover(salary, paid)).toBe(expected);
  });
});
