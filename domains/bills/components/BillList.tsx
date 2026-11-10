"use client";

import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { Fab } from "@/shared/components/Fab";
import { MoneyText } from "@/shared/components/MoneyText";
import { RecordActions } from "@/shared/components/RecordActions";
import { Badge } from "@/shared/components/ui/badge";
import { useRecordDialogs } from "@/shared/hooks/use-record-dialogs";

import { endBillAction } from "../actions/bills";
import type { ActiveBill } from "../services/bills";
import { BillFormModal } from "./BillFormModal";

type BillListProps = {
  bills: ActiveBill[];
  categories: { id: string; name: string }[];
};

export const BillList = ({ bills, categories }: BillListProps) => {
  const dialogs = useRecordDialogs<ActiveBill>(endBillAction);

  return (
    <>
      {bills.length ? (
        <ul className="divide-y rounded-xl border">
          {bills.map((bill) => (
            <li key={bill.id} className="flex items-center justify-between gap-2 py-2 pr-1 pl-4">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="flex items-center gap-2 font-medium">
                  {bill.name}
                  <Badge variant="secondary">{bill.value_mode === "fixed" ? "Fixo" : "Variável"}</Badge>
                </span>
                <span className="text-sm text-muted-foreground">
                  {bill.category.name} ·{" "}
                  {bill.amount_cents === null ? "Valor variável" : <MoneyText cents={bill.amount_cents} />}
                </span>
              </div>
              <RecordActions
                name={bill.name}
                removeVerb="Remover"
                onEdit={() => dialogs.openForm(bill)}
                onRemove={() => dialogs.askRemove(bill)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState message="Nenhum boleto cadastrado." />
      )}

      <Fab aria-label="Novo boleto" onClick={() => dialogs.openForm()} />

      {dialogs.editing && (
        <BillFormModal bill={dialogs.editing.item} categories={categories} onClose={dialogs.closeForm} />
      )}

      <ConfirmDialog
        open={!!dialogs.removing}
        onOpenChange={(open) => !open && dialogs.cancelRemove()}
        title="Remover boleto?"
        description={`"${dialogs.removing?.name}" deixará de aparecer nos próximos meses. Pagamentos anteriores continuam no histórico.`}
        confirmLabel="Remover"
        destructive
        pending={dialogs.removePending}
        error={dialogs.removeError}
        onConfirm={dialogs.confirmRemove}
      />
    </>
  );
};
