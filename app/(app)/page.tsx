import { Suspense } from "react";

import { endCardItemAction } from "@/domains/card-items/actions/card-items";
import { AddPaymentDialog } from "@/domains/payments/components/AddPaymentDialog";
import { PayableList } from "@/domains/payments/components/PayableList";
import { getMonthPayables } from "@/domains/payments/services/payables";
import { hasAnyPayment } from "@/domains/payments/services/build-payable-rows";
import { requireOnboarded } from "@/domains/profile/services/profile";
import { SalaryCard } from "@/domains/salary/components/SalaryCard";
import { getCurrentSalary } from "@/domains/salary/services/salary";
import { PageHeader } from "@/shared/components/PageHeader";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { currentMonth, formatMonth } from "@/shared/utils/month";

const Greeting = async () => {
  const { name } = await requireOnboarded();
  return <PageHeader title={`Olá, ${name}`} aside={formatMonth(currentMonth())} />;
};

const Summary = async () => {
  const [salaryCents, rows] = await Promise.all([getCurrentSalary(), getMonthPayables()]);

  return (
    <SalaryCard salaryCents={salaryCents} locked={hasAnyPayment(rows)} monthLabel={formatMonth(currentMonth())} />
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
