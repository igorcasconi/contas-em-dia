"use client";

import { LockIcon, PauseIcon, Trash2Icon } from "lucide-react";
import { type FormEvent, useId, useState, useTransition } from "react";

import { removeCardItemCopy } from "@/domains/card-items/services/removal-copy";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { MoneyText } from "@/shared/components/MoneyText";
import { SelectField } from "@/shared/components/SelectField";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import type { ActionResult } from "@/shared/helpers/action-result";
import { callAction } from "@/shared/helpers/call-action";
import { useRecordDialogs } from "@/shared/hooks/use-record-dialogs";
import { toSelectOptions } from "@/shared/utils/select-options";

import { payCardAction } from "../actions/payments";
import type { PayableItem, PayableRow } from "../services/build-payable-rows";
import { PaymentTotalFooter } from "./PaymentTotalFooter";

type PendingCard = Extract<PayableRow, { kind: "card" }>;
type Choice = { included: boolean; pause: boolean };

const isInstallment = (item: PayableItem) => item.remainingMonths !== null;

/** Parcela e avulso: sempre incluídos, sem pausar/remover. */
const isLocked = (item: PayableItem) => isInstallment(item) || item.purchase;

/** Ativo marcado; pausado desmarcado; parcelado e avulso sempre marcados. */
const initialChoice = (item: PayableItem): Choice => ({ included: item.status === "active", pause: false });

type ChecklistItemProps = {
  item: PayableItem;
  choice: Choice;
  onChange: (choice: Choice) => void;
  onRemove: () => void;
};

const ChecklistItem = ({ item, choice, onChange, onRemove }: ChecklistItemProps) => {
  const checkboxId = `card-item-${item.id}`;
  const locked = isLocked(item);

  return (
    <li className="flex items-center gap-3 py-2">
      <Checkbox
        id={checkboxId}
        checked={choice.included}
        disabled={locked}
        onCheckedChange={(checked) => onChange({ included: checked === true, pause: false })}
      />
      <label htmlFor={checkboxId} className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
        {item.name}
        {item.status === "paused" && !choice.included && <Badge variant="outline">Pausado</Badge>}
        {choice.pause && <Badge variant="outline">Será pausado</Badge>}
        {item.purchase && <Badge variant="outline">Avulso</Badge>}
      </label>
      <MoneyText cents={item.amountCents} className="text-sm" />
      {locked ? (
        <span
          className="flex size-9 items-center justify-center text-muted-foreground"
          title={item.purchase ? "Avulso: sempre incluído na fatura" : "Parcela: não pode ser removida da fatura"}
        >
          <LockIcon className="size-4" aria-label={item.purchase ? "Avulso" : "Parcela"} />
        </span>
      ) : (
        <span className="flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Pausar ${item.name}`}
            aria-pressed={choice.pause}
            onClick={() => onChange({ included: false, pause: !choice.pause })}
          >
            <PauseIcon aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label={`Remover ${item.name}`} onClick={onRemove}>
            <Trash2Icon aria-hidden />
          </Button>
        </span>
      )}
    </li>
  );
};

type CardPaymentFormProps = {
  banks: PendingCard[];
  removeItemAction: (id: string) => Promise<ActionResult>;
  onDone: () => void;
};

export const CardPaymentForm = ({ banks, removeItemAction, onDone }: CardPaymentFormProps) => {
  const itemsLabelId = useId();
  const [bankId, setBankId] = useState<string>();
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [error, setError] = useState<string>();
  const [pending, startPayment] = useTransition();
  const removal = useRecordDialogs<PayableItem>(removeItemAction);

  if (!banks.length) return <p className="text-sm text-muted-foreground">Nenhuma fatura pendente neste mês.</p>;

  const items = banks.find(({ id }) => id === bankId)?.items ?? [];
  const choiceOf = (item: PayableItem) => choices[item.id] ?? initialChoice(item);
  const totalCents = items
    .filter((item) => choiceOf(item).included)
    .reduce((total, { amountCents }) => total + amountCents, 0);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bankId) return;

    startPayment(async () => {
      const result = await callAction(() =>
        payCardAction({
          bankId,
          // Avulsos não vão no payload: pay_card soma os do banco/mês lidos do servidor
          items: items.filter(({ purchase }) => !purchase).map((item) => ({ cardItemId: item.id, ...choiceOf(item) })),
        }),
      );
      if (result.ok) onDone();
      else setError(result.error);
    });
  };

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-col gap-4">
      <SelectField
        label="Banco"
        name="bankId"
        value={bankId}
        onValueChange={(value) => {
          setBankId(value);
          setChoices({});
          setError(undefined);
        }}
        options={toSelectOptions(banks)}
      />

      {bankId && (
        // div (não fieldset): fieldset ignora min-height/overflow no flex e não rola
        <div role="group" aria-labelledby={itemsLabelId} className="flex min-h-0 flex-col">
          <p id={itemsLabelId} className="text-sm font-medium">
            Itens da fatura
          </p>
          <ul className="min-h-0 divide-y overflow-y-auto">
            {items.map((item) => (
              <ChecklistItem
                key={item.id}
                item={item}
                choice={choiceOf(item)}
                onChange={(choice) => setChoices((current) => ({ ...current, [item.id]: choice }))}
                onRemove={() => removal.askRemove(item)}
              />
            ))}
          </ul>
        </div>
      )}

      <PaymentTotalFooter totalCents={totalCents} pending={pending} disabled={totalCents === 0} error={error} />

      <ConfirmDialog
        open={!!removal.removing}
        onOpenChange={(open) => !open && removal.cancelRemove()}
        {...removeCardItemCopy(removal.removing?.name)}
        destructive
        pending={removal.removePending}
        error={removal.removeError}
        onConfirm={removal.confirmRemove}
      />
    </form>
  );
};
