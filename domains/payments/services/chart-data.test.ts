import { describe, expect, test } from "vitest";

import type { PayableRow } from "./build-payable-rows";
import { fillYearMonths, toBankTotals } from "./chart-data";

describe("fillYearMonths", () => {
  test("12 months: past without payment = 0, future = null", () => {
    const months = fillYearMonths([], "2026-03-01");

    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ month: "2026-01-01", label: "Jan", totalCents: 0 });
    expect(months[2].totalCents).toBe(0);
    expect(months[3]).toEqual({ month: "2026-04-01", label: "Abr", totalCents: null });
  });

  test("sums payments per month", () => {
    const months = fillYearMonths(
      [
        { month: "2026-01-01", total_cents: 12000 },
        { month: "2026-01-01", total_cents: 3000 },
        { month: "2026-03-01", total_cents: 500 },
      ],
      "2026-11-01",
    );

    expect(months.map(({ totalCents }) => totalCents)).toEqual([15000, 0, 500, 0, 0, 0, 0, 0, 0, 0, 0, null]);
  });
});

describe("fillYearMonths at year turn", () => {
  test("january shows only the new year; previous december is ignored", () => {
    const months = fillYearMonths([{ month: "2026-12-01", total_cents: 999 }], "2027-01-01");

    expect(months[0]).toEqual({ month: "2027-01-01", label: "Jan", totalCents: 0 });
    expect(months.slice(1).every(({ totalCents }) => totalCents === null)).toBe(true);
  });
});

describe("toBankTotals", () => {
  test("paid card rows only, highest total first", () => {
    const rows: PayableRow[] = [
      { kind: "card", id: "nu", name: "Nubank", amountCents: 20000, paymentId: "p1", items: [] },
      { kind: "card", id: "itau", name: "Itaú", amountCents: 50000, paymentId: "p2", items: [] },
      { kind: "card", id: "c6", name: "C6", amountCents: 9000, paymentId: null, items: [] },
      { kind: "bill", id: "b", name: "Vivo", valueMode: "fixed", amountCents: 12000, paymentId: "p3" },
    ];

    expect(toBankTotals(rows)).toEqual([
      { bankId: "itau", name: "Itaú", totalCents: 50000 },
      { bankId: "nu", name: "Nubank", totalCents: 20000 },
    ]);
  });
});
