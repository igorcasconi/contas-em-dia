"use client";

import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { Fab } from "@/shared/components/Fab";
import { MoneyText } from "@/shared/components/MoneyText";
import { RecordActions } from "@/shared/components/RecordActions";
import { useRecordDialogs } from "@/shared/hooks/use-record-dialogs";
import type { NamedRecord } from "@/shared/utils/select-options";

import { endCardItemAction } from "../actions/card-items";
import type { ActiveCardItem, CardItemGroup } from "../services/card-items";
import { removeCardItemCopy } from "../services/removal-copy";
import { CardItemFormModal } from "./CardItemFormModal";
import { CardItemStatusBadge } from "./CardItemStatusBadge";

type CardItemListProps = {
  groups: CardItemGroup[];
  categories: NamedRecord[];
  banks: NamedRecord[];
};

export const CardItemList = ({ groups, categories, banks }: CardItemListProps) => {
  const dialogs = useRecordDialogs<ActiveCardItem>(endCardItemAction);

  return (
    <>
      {groups.length ? (
        groups.map(({ bank, items }) => (
          <section key={bank.id} aria-labelledby={`bank-${bank.id}`} className="flex flex-col gap-2">
            <h2 id={`bank-${bank.id}`} className="text-sm font-medium text-muted-foreground">
              {bank.name}
            </h2>
            <ul className="divide-y rounded-xl border">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 py-2 pr-1 pl-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2 font-medium">
                      {item.name}
                      <CardItemStatusBadge item={item} />
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {item.category.name} · <MoneyText cents={item.amount_cents} />
                    </span>
                  </div>
                  <RecordActions
                    name={item.name}
                    removeVerb="Remover"
                    onEdit={() => dialogs.openForm(item)}
                    onRemove={() => dialogs.askRemove(item)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <EmptyState message="Nenhum item de cartão cadastrado." />
      )}

      <Fab aria-label="Novo item do cartão" onClick={() => dialogs.openForm()} />

      {dialogs.editing && (
        <CardItemFormModal
          item={dialogs.editing.item}
          categories={categories}
          banks={banks}
          onClose={dialogs.closeForm}
        />
      )}

      <ConfirmDialog
        open={!!dialogs.removing}
        onOpenChange={(open) => !open && dialogs.cancelRemove()}
        {...removeCardItemCopy(dialogs.removing?.name)}
        destructive
        pending={dialogs.removePending}
        error={dialogs.removeError}
        onConfirm={dialogs.confirmRemove}
      />
    </>
  );
};
