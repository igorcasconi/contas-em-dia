const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const BRL_PATTERN = /^(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?$/;

export const formatBRL = (cents: number) => brlFormatter.format(cents / 100);

export const parseBRL = (input: string) => {
  const match = input.replace("R$", "").trim().match(BRL_PATTERN);
  if (!match) return null;

  const [, integer, decimals = ""] = match;
  return Number(integer.replaceAll(".", "")) * 100 + Number(decimals.padEnd(2, "0"));
};
