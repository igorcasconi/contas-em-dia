"use client";

import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { Fab } from "@/shared/components/Fab";
import { MoneyText } from "@/shared/components/MoneyText";
import { RecordActions } from "@/shared/components/RecordActions";
import { useRecordDialogs } from "@/shared/hooks/use-record-dialogs";

import { deleteCardPurchaseAction } from "../actions/card-purchases";
import type { CardPurchase, CardPurchaseGroup } from "../services/card-purchases";
import { CardPurchaseFormModal } from "./CardPurchaseFormModal";

type Option = { id: string; name: string };

type CardPurchaseListProps = {
  groups: CardPurchaseGroup[];
  categories: Option[];
  banks: Option[];
};

export const CardPurchaseList = ({ groups, categories, banks }: CardPurchaseListProps) => {
  const dialogs = useRecordDialogs<CardPurchase>(deleteCardPurchaseAction);

  return (
    <>
      {groups.length ? (
        groups.map(({ bank, items, subtotalCents }) => (
          <section key={bank.id} aria-labelledby={`bank-${bank.id}`} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2 text-sm text-muted-foreground">
              <h2 id={`bank-${bank.id}`} className="font-medium">
                {bank.name}
              </h2>
              <span>
                Subtotal <MoneyText cents={subtotalCents} className="font-medium text-foreground" />
              </span>
            </div>
            <ul className="divide-y rounded-xl border">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 py-2 pr-1 pl-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.category.name} · <MoneyText cents={item.amount_cents} />
                    </span>
                  </div>
                  <RecordActions
                    name={item.name}
                    onEdit={() => dialogs.openForm(item)}
                    onRemove={() => dialogs.askRemove(item)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <EmptyState message="Nenhuma compra avulsa neste mês." />
      )}

      <Fab aria-label="Nova compra avulsa" onClick={() => dialogs.openForm()} />

      {dialogs.editing && (
        <CardPurchaseFormModal
          purchase={dialogs.editing.item}
          categories={categories}
          banks={banks}
          onClose={dialogs.closeForm}
        />
      )}

      <ConfirmDialog
        open={!!dialogs.removing}
        onOpenChange={(open) => !open && dialogs.cancelRemove()}
        title="Excluir compra avulsa?"
        description={`"${dialogs.removing?.name ?? ""}" será removida da fatura deste mês.`}
        confirmLabel="Excluir"
        destructive
        pending={dialogs.removePending}
        error={dialogs.removeError}
        onConfirm={dialogs.confirmRemove}
      />
    </>
  );
};
