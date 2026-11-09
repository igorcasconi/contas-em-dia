"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { SelectField } from "@/shared/components/SelectField";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";

import type { PayableRow } from "../services/build-payable-rows";
import { BillPaymentForm } from "./BillPaymentForm";

type PaymentKind = PayableRow["kind"];

const KIND_OPTIONS = [
  { value: "bill", label: "Boleto" },
  { value: "card", label: "Cartão de crédito" },
];

/** Botão + modal para registrar um pagamento do mês. Recebe só as linhas ainda não pagas. */
export const AddPaymentDialog = ({ pendingRows }: { pendingRows: PayableRow[] }) => {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PaymentKind>();

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setKind(undefined);
  };

  const pendingBills = pendingRows.filter((row) => row.kind === "bill");

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full lg:w-auto">
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
        {kind === "bill" && <BillPaymentForm bills={pendingBills} onDone={() => changeOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
};
