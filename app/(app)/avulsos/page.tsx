import { connection } from "next/server";
import { Suspense } from "react";

import { listBanks } from "@/domains/banks/services/banks";
import { CardPurchaseList } from "@/domains/card-purchases/components/CardPurchaseList";
import { listMonthPurchasesByBank } from "@/domains/card-purchases/services/card-purchases";
import { listCategories } from "@/domains/categories/services/categories";
import { PageHeader } from "@/shared/components/PageHeader";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { currentMonth, formatMonth } from "@/shared/utils/month";

const Header = async () => {
  await connection();
  return <PageHeader title="Avulsos" aside={formatMonth(currentMonth())} />;
};

const MonthPurchases = async () => {
  const [groups, categories, banks] = await Promise.all([listMonthPurchasesByBank(), listCategories(), listBanks()]);

  return <CardPurchaseList groups={groups} categories={categories} banks={banks} />;
};

export default function CardPurchasesPage() {
  return (
    <>
      <Suspense fallback={<Skeleton className="h-7 w-48" />}>
        <Header />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-48" />}>
        <MonthPurchases />
      </Suspense>
    </>
  );
}
