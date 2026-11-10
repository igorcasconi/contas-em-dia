import { describe, expect, test } from "vitest";

import { nameRecordSchema, nameRecordUpdateSchema } from "./name-record";

describe("nameRecordSchema", () => {
  test("trims the name", () => {
    expect(nameRecordSchema.parse({ name: "  Internet " })).toEqual({ name: "Internet" });
  });

  test.each(["", "   "])("rejects blank name %j", (name) => {
    expect(nameRecordSchema.safeParse({ name }).error?.issues[0].message).toBe("Informe o nome");
  });
});

describe("name length", () => {
  test("rejects more than 100 characters", () => {
    expect(nameRecordSchema.safeParse({ name: "x".repeat(101) }).error?.issues[0].message).toBe(
      "Use no máximo 100 caracteres",
    );
  });
});

describe("nameRecordUpdateSchema", () => {
  test("requires a valid id", () => {
    expect(nameRecordUpdateSchema.safeParse({ id: "abc", name: "Nubank" }).error?.issues[0].path).toEqual(["id"]);
  });

  test("accepts id and name", () => {
    const id = crypto.randomUUID();
    expect(nameRecordUpdateSchema.parse({ id, name: "Nubank" })).toEqual({ id, name: "Nubank" });
  });
});
