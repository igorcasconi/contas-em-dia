import { describe, expect, test } from "vitest";

import { type PayableSources, buildPayableRows, hasAnyPayment, pendingOnly, sumPaid } from "./build-payable-rows";

const empty: PayableSources = { bills: [], cardItems: [], banks: [], payments: [] };

const bill = (id: string, overrides: Partial<PayableSources["bills"][number]> = {}) => ({
  id,
  name: id,
  value_mode: "fixed",
  amount_cents: 1000,
  ended_at: null,
  ...overrides,
});

const cardItem = (id: string, bankId: string, overrides: Partial<PayableSources["cardItems"][number]> = {}) => ({
  id,
  name: id,
  bank_id: bankId,
  amount_cents: 1000,
  remaining_months: null,
  status: "active",
  ...overrides,
});

describe("buildPayableRows", () => {
  test("unpaid first, then by amount desc, variable without amount last in group", () => {
    const rows = buildPayableRows({
      ...empty,
      bills: [
        bill("Pequeno", { amount_cents: 500 }),
        bill("Grande", { amount_cents: 9000 }),
        bill("Energia", { value_mode: "variable", amount_cents: null }),
        bill("Pago", { amount_cents: 99999 }),
      ],
      payments: [{ id: "p1", kind: "bill", bill_id: "Pago", bank_id: null, total_cents: 99999, items: [] }],
    });

    expect(rows.map(({ name }) => name)).toEqual(["Grande", "Pequeno", "Energia", "Pago"]);
    expect(rows.find(({ name }) => name === "Energia")?.amountCents).toBeNull();
    expect(rows.at(-1)?.paymentId).toBe("p1");
  });

  test("unpaid bank sums active items and lists open items", () => {
    const rows = buildPayableRows({
      ...empty,
      banks: [{ id: "nu", name: "Nubank" }],
      cardItems: [
        cardItem("Netflix", "nu", { amount_cents: 5590 }),
        cardItem("Disney", "nu", { amount_cents: 3390, status: "paused" }),
        cardItem("Notebook", "nu", { amount_cents: 40220, remaining_months: 3 }),
      ],
    });

    expect(rows).toEqual([
      expect.objectContaining({ kind: "card", id: "nu", name: "Nubank", amountCents: 45810, paymentId: null }),
    ]);
    expect(rows[0].kind === "card" && rows[0].items.map(({ name }) => name)).toEqual(["Disney", "Netflix", "Notebook"]);
  });

  test("paid bank uses payment total and included items snapshot", () => {
    const rows = buildPayableRows({
      ...empty,
      banks: [{ id: "itau", name: "Itaú" }],
      cardItems: [cardItem("Seguro", "itau", { amount_cents: 4000 })],
      payments: [
        {
          id: "p2",
          kind: "card",
          bill_id: null,
          bank_id: "itau",
          total_cents: 15000,
          items: [
            { card_item_id: "Celular", included: true, amount_cents: 15000, prev_remaining_months: 1, prev_status: "active", card_item: { name: "Celular" } },
            { card_item_id: "Seguro", included: false, amount_cents: 4000, prev_remaining_months: null, prev_status: "active", card_item: { name: "Seguro" } },
          ],
        },
      ],
    });

    expect(rows[0]).toEqual({
      kind: "card",
      id: "itau",
      name: "Itaú",
      amountCents: 15000,
      paymentId: "p2",
      items: [{ id: "Celular", name: "Celular", amountCents: 15000, remainingMonths: 1, status: "active" }],
    });
  });

  test("ended bill appears only when paid in the month", () => {
    const rows = buildPayableRows({
      ...empty,
      bills: [bill("Encerrado pago", { ended_at: "2026-11-05" }), bill("Encerrado", { ended_at: "2026-10-01" })],
      payments: [{ id: "p3", kind: "bill", bill_id: "Encerrado pago", bank_id: null, total_cents: 1000, items: [] }],
    });

    expect(rows.map(({ name }) => name)).toEqual(["Encerrado pago"]);
  });

  test("bank with only paused items appears with zero", () => {
    const rows = buildPayableRows({
      ...empty,
      banks: [{ id: "c6", name: "C6" }, { id: "vazio", name: "Sem itens" }],
      cardItems: [cardItem("Disney", "c6", { status: "paused" })],
    });

    expect(rows).toEqual([expect.objectContaining({ id: "c6", amountCents: 0 })]);
  });
});

describe("sumPaid", () => {
  test("sums amounts of paid rows only", () => {
    const rows = buildPayableRows({
      ...empty,
      bills: [bill("A", { amount_cents: 1000 }), bill("B", { amount_cents: 2500 })],
      payments: [{ id: "p", kind: "bill", bill_id: "B", bank_id: null, total_cents: 2500, items: [] }],
    });

    expect(sumPaid(rows)).toBe(2500);
  });
});

describe("hasAnyPayment", () => {
  test("false without payments, true with any", () => {
    const unpaid = buildPayableRows({ ...empty, bills: [bill("A")] });
    const paid = buildPayableRows({
      ...empty,
      bills: [bill("A")],
      payments: [{ id: "p", kind: "bill", bill_id: "A", bank_id: null, total_cents: 1000, items: [] }],
    });

    expect(hasAnyPayment(unpaid)).toBe(false);
    expect(hasAnyPayment(paid)).toBe(true);
  });
});

describe("pendingOnly", () => {
  test("keeps only rows without payment", () => {
    const rows = buildPayableRows({
      ...empty,
      bills: [bill("A"), bill("B")],
      payments: [{ id: "p", kind: "bill", bill_id: "B", bank_id: null, total_cents: 1000, items: [] }],
    });

    expect(pendingOnly(rows).map(({ name }) => name)).toEqual(["A"]);
  });
});

describe("paid amount", () => {
  test("paid bills show the paid amount, not the registered one", () => {
    const rows = buildPayableRows({
      ...empty,
      bills: [
        bill("Fixo editado", { amount_cents: 1000 }),
        bill("Variável", { value_mode: "variable", amount_cents: null }),
      ],
      payments: [
        { id: "p1", kind: "bill", bill_id: "Fixo editado", bank_id: null, total_cents: 1200, items: [] },
        { id: "p2", kind: "bill", bill_id: "Variável", bank_id: null, total_cents: 18745, items: [] },
      ],
    });

    expect(rows.map(({ name, amountCents }) => [name, amountCents])).toEqual([
      ["Variável", 18745],
      ["Fixo editado", 1200],
    ]);
  });
});
