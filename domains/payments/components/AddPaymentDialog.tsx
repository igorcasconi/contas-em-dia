"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { SelectField } from "@/shared/components/SelectField";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

import type { ActionResult } from "@/shared/helpers/action-result";

import { type PayableRow, pendingOnly } from "../services/build-payable-rows";
import { BillPaymentForm } from "./BillPaymentForm";
import { CardPaymentForm } from "./CardPaymentForm";

type PaymentKind = PayableRow["kind"];

const KIND_OPTIONS = [
  { value: "bill", label: "Boleto" },
  { value: "card", label: "Cartão de crédito" },
];

type AddPaymentDialogProps = {
  /** Linhas do mês; o modal oferece só as ainda não pagas. */
  rows: PayableRow[];
  /** Encerra um item recorrente do cartão (domínio card-items, injetado pela página). */
  removeCardItemAction: (id: string) => Promise<ActionResult>;
};

/** Botão + modal para registrar um pagamento do mês. */
export const AddPaymentDialog = ({
  rows,
  removeCardItemAction,
}: AddPaymentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PaymentKind>();

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setKind(undefined);
  };

  const pendingRows = pendingOnly(rows);
  const pendingBills = pendingRows.filter((row) => row.kind === "bill");
  const pendingCards = pendingRows.filter((row) => row.kind === "card");

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full lg:w-auto cursor-pointer">
          <PlusIcon aria-hidden />
          Adicionar pagamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar pagamento</DialogTitle>
        </DialogHeader>
        <SelectField
          label="Tipo de pagamento"
          name="kind"
          value={kind}
          onValueChange={(value) => setKind(value as PaymentKind)}
          options={KIND_OPTIONS}
        />
        {kind === "bill" && (
          <BillPaymentForm
            bills={pendingBills}
            onDone={() => changeOpen(false)}
          />
        )}
        {kind === "card" && (
          <CardPaymentForm
            banks={pendingCards}
            removeItemAction={removeCardItemAction}
            onDone={() => changeOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
