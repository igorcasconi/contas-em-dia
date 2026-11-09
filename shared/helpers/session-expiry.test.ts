import { describe, expect, test } from "vitest";

import { isSessionExpired } from "./session-expiry";

const DAY = 24 * 60 * 60;
const loginAt = 1_800_000_000;
const at = (secondsAfterLogin: number) => new Date((loginAt + secondsAfterLogin) * 1000);
const amr = [{ method: "password", timestamp: loginAt }];

describe("isSessionExpired", () => {
  test("valid at 29 days and 23 hours", () => {
    expect(isSessionExpired(amr, at(29 * DAY + 23 * 60 * 60))).toBe(false);
  });

  test("expired at 30 days and 1 second", () => {
    expect(isSessionExpired(amr, at(30 * DAY + 1))).toBe(true);
  });

  test("uses the oldest authentication when there are many", () => {
    const withMfa = [{ method: "totp", timestamp: loginAt + 20 * DAY }, ...amr];
    expect(isSessionExpired(withMfa, at(30 * DAY + 1))).toBe(true);
  });

  test("expired when amr has no timestamps", () => {
    expect(isSessionExpired(undefined, at(0))).toBe(true);
    expect(isSessionExpired(["password"], at(0))).toBe(true);
  });
});
