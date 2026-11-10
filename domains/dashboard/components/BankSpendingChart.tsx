"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";

import { EmptyState } from "@/shared/components/EmptyState";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { formatBRL } from "@/shared/utils/money";

type BankTotal = { bankId: string; name: string; totalCents: number };

const chartConfig = {
  totalCents: { label: "Pago", color: "var(--chart-3)" },
} satisfies ChartConfig;

const BAR_HEIGHT = 40;

export const BankSpendingChart = ({ banks }: { banks: BankTotal[] }) => {
  if (!banks.length) return <EmptyState message="Nenhum pagamento de cartão neste mês." />;

  return (
    <figure className="flex flex-col gap-2">
      <ChartContainer
        config={chartConfig}
        role="img"
        aria-label="Total pago por cartão neste mês"
        className="aspect-auto w-full"
        style={{ height: banks.length * BAR_HEIGHT + 16 }}
      >
        <BarChart data={banks} layout="vertical" accessibilityLayer margin={{ left: 8, right: 8 }}>
          <XAxis type="number" dataKey="totalCents" hide />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={80} />
          <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => formatBRL(Number(value))} />} />
          <Bar dataKey="totalCents" fill="var(--color-totalCents)" radius={4} />
        </BarChart>
      </ChartContainer>
      <ul className="sr-only">
        {banks.map(({ bankId, name, totalCents }) => (
          <li key={bankId}>
            {name}: {formatBRL(totalCents)}
          </li>
        ))}
      </ul>
    </figure>
  );
};
