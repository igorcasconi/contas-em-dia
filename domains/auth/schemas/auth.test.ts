import { describe, expect, test } from "vitest";

import { signInSchema, signUpSchema } from "./auth";

describe("signInSchema", () => {
  test("accepts email and password", () => {
    expect(signInSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  test("rejects invalid email", () => {
    const result = signInSchema.safeParse({ email: "abc", password: "x" });
    expect(result.error?.issues[0].path).toEqual(["email"]);
  });

  test("rejects empty password", () => {
    const result = signInSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.error?.issues[0].path).toEqual(["password"]);
  });
});

describe("signUpSchema", () => {
  const valid = { email: "a@b.com", password: "12345678", confirmPassword: "12345678" };

  test("accepts matching passwords with 8+ chars", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  test("rejects password shorter than 8", () => {
    const result = signUpSchema.safeParse({ ...valid, password: "1234567", confirmPassword: "1234567" });
    expect(result.error?.issues[0].path).toEqual(["password"]);
  });

  test("rejects different confirmation", () => {
    const result = signUpSchema.safeParse({ ...valid, confirmPassword: "87654321" });
    expect(result.error?.issues[0]).toMatchObject({ path: ["confirmPassword"], message: "As senhas não conferem" });
  });
});
