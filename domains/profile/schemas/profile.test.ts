import { describe, expect, test } from "vitest";

import { onboardingSchema } from "./profile";

describe("onboardingSchema", () => {
  test("accepts name and salary, trimming the name", () => {
    expect(onboardingSchema.parse({ name: "  Igor ", salary: "5.000,00" })).toEqual({ name: "Igor", salary: 500000 });
  });

  test("rejects blank name", () => {
    const result = onboardingSchema.safeParse({ name: "   ", salary: "100" });
    expect(result.error?.issues[0].path).toEqual(["name"]);
  });

  test.each(["0", "-10,00"])("rejects salary %s", (salary) => {
    const result = onboardingSchema.safeParse({ name: "Igor", salary });
    expect(result.error?.issues[0].path).toEqual(["salary"]);
  });
});
