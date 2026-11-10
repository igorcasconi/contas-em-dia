import { describe, expect, test } from "vitest";

import { isRecordId } from "./record-id";

describe("isRecordId", () => {
  test("accepts uuid", () => {
    expect(isRecordId(crypto.randomUUID())).toBe(true);
  });

  test.each(["", "abc", "1; drop table bills", undefined, 42])("rejects %j", (value) => {
    expect(isRecordId(value)).toBe(false);
  });
});
