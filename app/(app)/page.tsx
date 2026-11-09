import { Suspense } from "react";

import { endCardItemAction } from "@/domains/card-items/actions/card-items";
import { AddPaymentDialog } from "@/domains/payments/components/AddPaymentDialog";
import { getMonthPayables } from "@/domains/payments/services/payables";
import { requireOnboarded } from "@/domains/profile/services/profile";
import { PageHeader } from "@/shared/components/PageHeader";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { currentMonth, formatMonth } from "@/shared/utils/month";

const Greeting = async () => {
  const { name } = await requireOnboarded();
  return <PageHeader title={`Olá, ${name}`} aside={formatMonth(currentMonth())} />;
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

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<Skeleton className="h-7 w-48" />}>
        <Greeting />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-10" />}>
        <AddPayment />
      </Suspense>
    </>
  );
}
