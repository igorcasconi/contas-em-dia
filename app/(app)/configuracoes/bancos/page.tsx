import { Suspense } from "react";

import { createBankAction, deleteBankAction, updateBankAction } from "@/domains/banks/actions/banks";
import { listBanks } from "@/domains/banks/services/banks";
import { PageHeader } from "@/shared/components/PageHeader";
import { SimpleNameCrud } from "@/shared/components/SimpleNameCrud";
import { Skeleton } from "@/shared/components/ui/skeleton";

const BanksList = async () => (
  <SimpleNameCrud
    items={await listBanks()}
    entityLabel="banco"
    emptyMessage="Nenhum banco cadastrado."
    createAction={createBankAction}
    updateAction={updateBankAction}
    deleteAction={deleteBankAction}
  />
);

export default function BanksPage() {
  return (
    <>
      <PageHeader title="Bancos" />
      <Suspense fallback={<Skeleton className="h-32" />}>
        <BanksList />
      </Suspense>
    </>
  );
}
