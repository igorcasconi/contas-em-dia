import { Suspense } from "react";

import { BillList } from "@/domains/bills/components/BillList";
import { listActiveBills } from "@/domains/bills/services/bills";
import { listCategories } from "@/domains/categories/services/categories";
import { PageHeader } from "@/shared/components/PageHeader";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { UrlTabs } from "@/shared/components/UrlTabs";

const RecurrenceTabs = async () => {
  const [bills, categories] = await Promise.all([listActiveBills(), listCategories()]);

  return (
    <UrlTabs
      param="aba"
      tabs={[{ value: "boletos", label: "Boletos", content: <BillList bills={bills} categories={categories} /> }]}
    />
  );
};

export default function RecurrencesPage() {
  return (
    <>
      <PageHeader title="Recorrências" />
      <Suspense fallback={<Skeleton className="h-48" />}>
        <RecurrenceTabs />
      </Suspense>
    </>
  );
}
