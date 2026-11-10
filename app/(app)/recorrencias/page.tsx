import { Suspense } from "react";

import { listBanks } from "@/domains/banks/services/banks";
import { BillList } from "@/domains/bills/components/BillList";
import { listActiveBills } from "@/domains/bills/services/bills";
import { CardItemList } from "@/domains/card-items/components/CardItemList";
import { listCardItemsByBank } from "@/domains/card-items/services/card-items";
import { listCategories } from "@/domains/categories/services/categories";
import { PageHeader } from "@/shared/components/PageHeader";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { UrlTabs } from "@/shared/components/UrlTabs";

const RecurrenceTabs = async () => {
  const [bills, cardItemGroups, categories, banks] = await Promise.all([
    listActiveBills(),
    listCardItemsByBank(),
    listCategories(),
    listBanks(),
  ]);

  return (
    <UrlTabs
      param="aba"
      tabs={[
        { value: "boletos", label: "Boletos", content: <BillList bills={bills} categories={categories} /> },
        {
          value: "cartao",
          label: "Cartão",
          content: <CardItemList groups={cardItemGroups} categories={categories} banks={banks} />,
        },
      ]}
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
