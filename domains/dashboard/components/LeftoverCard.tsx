import { MoneyText } from "@/shared/components/MoneyText";

export const LeftoverCard = ({ leftoverCents }: { leftoverCents: number }) => (
  <section aria-label="Sobra" className="flex flex-col gap-1 rounded-xl border p-4">
    <span className="flex h-8 items-center text-sm text-muted-foreground">Sobra</span>
    <MoneyText cents={leftoverCents} className="text-xl font-semibold" />
    {leftoverCents < 0 && <p className="text-xs text-destructive">Pagamentos acima do salário do mês.</p>}
  </section>
);
