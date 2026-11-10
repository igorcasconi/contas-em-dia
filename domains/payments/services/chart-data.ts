import { formatMonthShort } from "@/shared/utils/month";

import type { PayableRow } from "./build-payable-rows";

export type MonthTotal = { month: string; label: string; totalCents: number | null };

/**
 * Total pago por mês no ano do mês corrente (jan–dez).
 * Mês passado/atual sem pagamento = 0; mês futuro = null (sem projeção).
 */
export const fillYearMonths = (payments: { month: string; total_cents: number }[], currentMonth: string) => {
  const year = currentMonth.slice(0, 4);

  return Array.from({ length: 12 }, (_, index): MonthTotal => {
    const month = `${year}-${String(index + 1).padStart(2, "0")}-01`;
    const totalCents =
      month > currentMonth
        ? null
        : payments.filter((payment) => payment.month === month).reduce((total, { total_cents }) => total + total_cents, 0);

    return { month, label: formatMonthShort(month), totalCents };
  });
};

/** Total pago por banco no mês, maior primeiro. */
export const toBankTotals = (rows: PayableRow[]) =>
  rows
    .flatMap((row) => (row.kind === "card" && row.paymentId ? [{ bankId: row.id, name: row.name, totalCents: row.amountCents }] : []))
    .sort((a, b) => b.totalCents - a.totalCents);

export type BankTotal = ReturnType<typeof toBankTotals>[number];
