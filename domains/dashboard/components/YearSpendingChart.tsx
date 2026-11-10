"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import type { MonthTotal } from "@/domains/payments/services/chart-data";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { formatBRL } from "@/shared/utils/money";

const chartConfig = {
  totalCents: { label: "Total pago", color: "var(--chart-2)" },
} satisfies ChartConfig;

export const YearSpendingChart = ({ year, months }: { year: string; months: MonthTotal[] }) => (
  <figure className="flex flex-col gap-2">
    <ChartContainer config={chartConfig} role="img" aria-label={`Total pago por mês em ${year}`} className="aspect-auto h-48 w-full">
      <BarChart data={months} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatBRL(Number(value))} />} />
        <Bar dataKey="totalCents" fill="var(--color-totalCents)" radius={4} />
      </BarChart>
    </ChartContainer>
    <ul className="sr-only">
      {months
        .filter(({ totalCents }) => totalCents !== null)
        .map(({ month, label, totalCents }) => (
          <li key={month}>
            {label}: {formatBRL(totalCents ?? 0)}
          </li>
        ))}
    </ul>
  </figure>
);
