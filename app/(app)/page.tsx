import { Suspense } from "react";

import { endCardItemAction } from "@/domains/card-items/actions/card-items";
import { LeftoverCard } from "@/domains/dashboard/components/LeftoverCard";
import { getMonthSummary } from "@/domains/dashboard/services/summary";
import { AddPaymentDialog } from "@/domains/payments/components/AddPaymentDialog";
import { PayableList } from "@/domains/payments/components/PayableList";
import { getMonthPayables } from "@/domains/payments/services/payables";
import { requireOnboarded } from "@/domains/profile/services/profile";
import { SalaryCard } from "@/domains/salary/components/SalaryCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { currentMonth, formatMonth } from "@/shared/utils/month";

const Greeting = async () => {
  const { name } = await requireOnboarded();
  return <PageHeader title={`Olá, ${name}`} aside={formatMonth(currentMonth())} />;
};

const Summary = async () => {
  const { salaryCents, leftoverCents, hasPayments } = await getMonthSummary();

  return (
    <div className="grid grid-cols-2 gap-3">
      <SalaryCard salaryCents={salaryCents} locked={hasPayments} monthLabel={formatMonth(currentMonth())} />
      <LeftoverCard leftoverCents={leftoverCents} />
    </div>
  );
};

const AddPayment = async () => {
  const rows = await getMonthPayables();
  return (
    <AddPaymentDialog
      pendingRows={rows.filter(({ paymentId }) => !paymentId)}
      removeCardItemAction={endCardItemAction}
    />
  );
};

const MonthPayables = async () => <PayableList rows={await getMonthPayables()} />;

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<Skeleton className="h-7 w-48" />}>
        <Greeting />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-24" />}>
        <Summary />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-10" />}>
        <AddPayment />
      </Suspense>
      <section aria-labelledby="month-payables" className="flex flex-col gap-3">
        <h2 id="month-payables" className="font-medium">
          Pagamentos do mês
        </h2>
        <Suspense fallback={<Skeleton className="h-40" />}>
          <MonthPayables />
        </Suspense>
      </section>
    </>
  );
}
