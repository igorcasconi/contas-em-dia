const TIME_ZONE = "America/Sao_Paulo";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const yearMonthFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

/** Primeiro dia do mês corrente no fuso de São Paulo, formato `YYYY-MM-01`. */
export const currentMonth = (now = new Date()) => `${yearMonthFormatter.format(now)}-01`;

/** `2026-03-01` → `Mar` */
export const formatMonthShort = (month: string) => MONTH_LABELS[Number(month.split("-")[1]) - 1];

/** `2026-03-01` → `Mar/2026` */
export const formatMonth = (month: string) => `${formatMonthShort(month)}/${month.split("-")[0]}`;

/** `1` → `1 mês restante`; `3` → `3 meses restantes` */
export const formatRemainingMonths = (months: number) =>
  months === 1 ? "1 mês restante" : `${months} meses restantes`;
