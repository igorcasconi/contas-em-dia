const TIME_ZONE = "America/Sao_Paulo";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const yearMonthFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

/** Primeiro dia do mês corrente no fuso de São Paulo, formato `YYYY-MM-01`. */
export const currentMonth = (now = new Date()) => `${yearMonthFormatter.format(now)}-01`;

export const formatMonth = (month: string) => {
  const [year, monthNumber] = month.split("-");
  return `${MONTH_LABELS[Number(monthNumber) - 1]}/${year}`;
};
