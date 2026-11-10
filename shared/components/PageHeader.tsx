import { endCardItemAction } from "@/domains/card-items/actions/card-items";
import { AddPaymentDialog } from "@/domains/payments/components/AddPaymentDialog";
import { getMonthPayables } from "@/domains/payments/services/payables";
import { Suspense, type ReactNode } from "react";
import { Skeleton } from "./ui/skeleton";

export const PageHeader = async ({
  title,
  aside,
}: {
  title: string;
  aside?: ReactNode;
}) => (
  <header className="flex items-baseline justify-between gap-4">
    <h1 className="font-heading text-xl font-semibold">{title}</h1>
    {aside && (
      <div className="flex items-center gap-2">
        <Suspense fallback={<Skeleton className="h-10" />}>
          <AddPaymentDialog
            rows={await getMonthPayables()}
            removeCardItemAction={endCardItemAction}
          />
        </Suspense>

        <span className="text-sm text-muted-foreground ml-3">{aside}</span>
      </div>
    )}
  </header>
);
