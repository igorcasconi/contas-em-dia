import "server-only";

import { toBankTotals } from "@/domains/payments/services/chart-data";
import { getMonthPayables } from "@/domains/payments/services/payables";
import { getYearTotals } from "@/domains/payments/services/year-totals";

/** Dados dos gráficos da Início: ano corrente (jan–dez) e cartões pagos no mês. */
export const getChartData = async () => {
  const [months, rows] = await Promise.all([getYearTotals(), getMonthPayables()]);
  return { year: months[0].month.slice(0, 4), months, banks: toBankTotals(rows) };
};
