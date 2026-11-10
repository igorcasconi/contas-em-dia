import { connection } from "next/server";
import { Suspense } from "react";

import { listBanks } from "@/domains/banks/services/banks";
import { CardPurchaseList } from "@/domains/card-purchases/components/CardPurchaseList";
import { listMonthPurchasesByBank } from "@/domains/card-purchases/services/card-purchases";
import { listCategories } from "@/domains/categories/services/categories";
import { PageHeader } from "@/shared/components/PageHeader";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { currentMonth, formatMonth } from "@/shared/utils/month";

// Mês fora do `aside` do PageHeader: o `aside` também renderiza "Adicionar pagamento", que não pertence a esta tela
const Header = async () => {
  await connection();
  return (
    <div className="flex items-baseline justify-between gap-4">
      <PageHeader title="Avulsos" />
      <span className="text-sm text-muted-foreground">{formatMonth(currentMonth())}</span>
    </div>
  );
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
