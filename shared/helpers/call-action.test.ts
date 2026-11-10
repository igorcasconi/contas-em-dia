import { redirect } from "next/navigation";
import { describe, expect, test } from "vitest";

import { NETWORK_ERROR, callAction } from "./call-action";

describe("callAction", () => {
  test("returns the action result", async () => {
    expect(await callAction(async () => ({ ok: true, data: 1 }))).toEqual({ ok: true, data: 1 });
  });

  test("turns a rejected call (network failure) into a failed result", async () => {
    expect(await callAction(() => Promise.reject(new TypeError("Failed to fetch")))).toEqual({
      ok: false,
      error: NETWORK_ERROR,
    });
  });

  test("rethrows Next.js internal errors such as redirect", async () => {
    await expect(callAction(async () => redirect("/login"))).rejects.toThrow("NEXT_REDIRECT");
  });
});
