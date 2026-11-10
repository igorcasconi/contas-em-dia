import { Suspense } from "react";

import { endCardItemAction } from "@/domains/card-items/actions/card-items";
import { BankSpendingChart } from "@/domains/dashboard/components/BankSpendingChart";
import { LeftoverCard } from "@/domains/dashboard/components/LeftoverCard";
import { YearSpendingChart } from "@/domains/dashboard/components/YearSpendingChart";
import { getChartData } from "@/domains/dashboard/services/chart-data";
import { getMonthSummary } from "@/domains/dashboard/services/summary";
import { AddPaymentDialog } from "@/domains/payments/components/AddPaymentDialog";
import { PayableList } from "@/domains/payments/components/PayableList";
import { getMonthPayables } from "@/domains/payments/services/payables";
import { requireOnboarded } from "@/domains/profile/services/profile";
import { SalaryCard } from "@/domains/salary/components/SalaryCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { currentMonth, formatMonth } from "@/shared/utils/month";

const AddPayment = async () => (
  <AddPaymentDialog rows={await getMonthPayables()} removeCardItemAction={endCardItemAction} />
);

const Greeting = async () => {
  const { name } = await requireOnboarded();
  return (
    <PageHeader
      title={`Olá, ${name}`}
      aside={formatMonth(currentMonth())}
      action={
        <Suspense fallback={<Skeleton className="h-10" />}>
          <AddPayment />
        </Suspense>
      }
    />
  );
};

const Summary = async () => {
  const { salaryCents, leftoverCents, hasPayments } = await getMonthSummary();

  return (
    <div className="grid grid-cols-2 gap-3">
      <SalaryCard
        salaryCents={salaryCents}
        locked={hasPayments}
        monthLabel={formatMonth(currentMonth())}
      />
      <LeftoverCard leftoverCents={leftoverCents} />
    </div>
  );
};

const MonthPayables = async () => (
  <PayableList rows={await getMonthPayables()} />
);

const Charts = async () => {
  const { year, months, banks } = await getChartData();

  return (
    <>
      <section aria-labelledby="year-spending" className="flex flex-col gap-3">
        <h2 id="year-spending" className="font-medium">
          Gastos em {year}
        </h2>
        <YearSpendingChart year={year} months={months} />
      </section>
      <section aria-labelledby="bank-spending" className="flex flex-col gap-3">
        <h2 id="bank-spending" className="font-medium">
          Cartões neste mês
        </h2>
        <BankSpendingChart banks={banks} />
      </section>
    </>
  );
};

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<Skeleton className="h-7 w-48" />}>
        <Greeting />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-24" />}>
        <Summary />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section
          aria-labelledby="month-payables"
          className="flex flex-col gap-3"
        >
          <h2 id="month-payables" className="font-medium">
            Pagamentos do mês
          </h2>
          <Suspense fallback={<Skeleton className="h-40" />}>
            <MonthPayables />
          </Suspense>
        </section>
        <div className="flex flex-col gap-6">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <Charts />
          </Suspense>
        </div>
      </div>
    </>
  );
}
