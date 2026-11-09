"use client";

import { ChevronDownIcon, CircleCheckIcon, CircleIcon, Undo2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { MoneyText } from "@/shared/components/MoneyText";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useRecordDialogs } from "@/shared/hooks/use-record-dialogs";
import { cn } from "@/shared/utils/cn";
import { formatBRL } from "@/shared/utils/money";

import { undoPaymentAction } from "../actions/payments";
import type { PayableItem, PayableRow } from "../services/build-payable-rows";

const remainingLabel = (months: number) => (months === 1 ? "1 mês restante" : `${months} meses restantes`);

const CardItems = ({ id, items }: { id: string; items: PayableItem[] }) => (
  <ul id={id} className="flex flex-col gap-1 border-l pl-3 text-sm text-muted-foreground">
    {items.map((item) => (
      <li key={item.id} className="flex items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2">
          {item.name}
          {item.remainingMonths !== null && <Badge variant="outline">{remainingLabel(item.remainingMonths)}</Badge>}
          {item.status === "paused" && <Badge variant="outline">Pausado</Badge>}
        </span>
        <MoneyText cents={item.amountCents} />
      </li>
    ))}
  </ul>
);

type PayableRowItemProps = { row: PayableRow; onUndo: () => void };

const PayableRowItem = ({ row, onUndo }: PayableRowItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const paid = !!row.paymentId;
  const itemsId = `payable-items-${row.id}`;
  const StatusIcon = paid ? CircleCheckIcon : CircleIcon;

  return (
    <li className="flex flex-col gap-2 py-3 pr-1 pl-4">
      <div className="flex items-center gap-3">
        <StatusIcon className={cn("size-4 shrink-0", paid ? "text-primary" : "text-muted-foreground")} aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-medium">{row.name}</span>
          <span className="flex items-center gap-2 text-sm">
            {row.amountCents === null ? (
              <span className="text-muted-foreground">Valor variável</span>
            ) : (
              <MoneyText cents={row.amountCents} />
            )}
            <Badge variant={paid ? "default" : "outline"}>{paid ? "Pago" : "Não pago"}</Badge>
          </span>
        </div>
        {row.kind === "card" && (
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={`Itens de ${row.name}`}
            aria-expanded={expanded}
            aria-controls={itemsId}
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDownIcon className={cn("transition-transform", expanded && "rotate-180")} aria-hidden />
          </Button>
        )}
        {paid && (
          <Button variant="ghost" size="icon-lg" aria-label={`Desfazer pagamento de ${row.name}`} onClick={onUndo}>
            <Undo2Icon aria-hidden />
          </Button>
        )}
      </div>
      {row.kind === "card" && expanded && <CardItems id={itemsId} items={row.items} />}
    </li>
  );
};

type UndoTarget = { id: string; row: PayableRow };

/** Pagamentos do mês: não pagos primeiro; faturas expansíveis; desfazer com confirmação. */
export const PayableList = ({ rows }: { rows: PayableRow[] }) => {
  const undo = useRecordDialogs<UndoTarget>(undoPaymentAction);

  if (!rows.length) {
    return (
      <EmptyState
        message="Nenhuma conta cadastrada."
        action={
          <Button asChild variant="outline">
            <Link href="/recorrencias">Cadastrar recorrências</Link>
          </Button>
        }
      />
    );
  }

  const target = undo.removing?.row;

  return (
    <>
      <ul className="divide-y rounded-xl border">
        {rows.map((row) => (
          <PayableRowItem
            key={`${row.kind}-${row.id}`}
            row={row}
            onUndo={() => row.paymentId && undo.askRemove({ id: row.paymentId, row })}
          />
        ))}
      </ul>

      <ConfirmDialog
        open={!!target}
        onOpenChange={(open) => !open && undo.cancelRemove()}
        title="Desfazer pagamento?"
        description={
          target &&
          `${target.name} — ${formatBRL(target.amountCents ?? 0)}.${target.kind === "card" ? " Parcelas e itens pausados voltam ao estado anterior." : ""}`
        }
        confirmLabel="Desfazer"
        destructive
        pending={undo.removePending}
        error={undo.removeError}
        onConfirm={undo.confirmRemove}
      />
    </>
  );
};
