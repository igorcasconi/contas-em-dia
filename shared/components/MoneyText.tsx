import { cn } from "@/shared/utils/cn";
import { formatBRL } from "@/shared/utils/money";

/** Valor em centavos formatado em BRL; negativo em destaque. */
export const MoneyText = ({ cents, className }: { cents: number; className?: string }) => (
  <span className={cn("tabular-nums", cents < 0 && "text-destructive", className)}>{formatBRL(cents)}</span>
);
