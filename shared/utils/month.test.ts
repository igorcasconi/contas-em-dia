import { describe, expect, test } from "vitest";
import { currentMonth, formatMonth, formatMonthShort } from "./month";

describe("currentMonth", () => {
  test("returns first day of month in São Paulo", () => {
    expect(currentMonth(new Date("2026-11-15T12:00:00Z"))).toBe("2026-11-01");
  });

  test("still previous month in São Paulo right after UTC midnight", () => {
    expect(currentMonth(new Date("2026-12-01T02:00:00Z"))).toBe("2026-11-01");
  });

  test("turns the year at São Paulo midnight", () => {
    expect(currentMonth(new Date("2027-01-01T03:00:00Z"))).toBe("2027-01-01");
  });
});

describe("formatMonth", () => {
  test.each([
    ["2026-11-01", "Nov/2026"],
    ["2027-01-01", "Jan/2027"],
    ["2026-02-01", "Fev/2026"],
  ])("%s → %s", (month, expected) => {
    expect(formatMonth(month)).toBe(expected);
  });
});

describe("formatMonthShort", () => {
  test("returns month abbreviation", () => {
    expect(formatMonthShort("2026-03-01")).toBe("Mar");
  });
});
