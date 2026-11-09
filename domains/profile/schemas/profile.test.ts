import { describe, expect, test } from "vitest";

import { onboardingSchema, profileSchema } from "./profile";

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

describe("profileSchema", () => {
  test("trims the name", () => {
    expect(profileSchema.parse({ name: " Bea " })).toEqual({ name: "Bea" });
  });

  test("rejects blank name", () => {
    expect(profileSchema.safeParse({ name: "" }).error?.issues[0].message).toBe("Informe seu nome");
  });
});
