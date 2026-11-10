"use client";

import { useState } from "react";

import { MoneyField } from "@/shared/components/MoneyInput";
import { SelectField } from "@/shared/components/SelectField";
import { useFormAction } from "@/shared/hooks/use-form-action";
import { submitWithoutReset } from "@/shared/utils/form";
import { toSelectOptions } from "@/shared/utils/select-options";

import { payBillAction } from "../actions/payments";
import type { PayableRow } from "../services/build-payable-rows";
import { PaymentTotalFooter } from "./PaymentTotalFooter";

type PendingBill = Extract<PayableRow, { kind: "bill" }>;

export const BillPaymentForm = ({ bills, onDone }: { bills: PendingBill[]; onDone: () => void }) => {
  const [billId, setBillId] = useState<string>();
  const [variableAmount, setVariableAmount] = useState<number | null>(null);
  const { formAction, pending, fieldErrors, error } = useFormAction(payBillAction, onDone);

  if (!bills.length) return <p className="text-sm text-muted-foreground">Nenhum boleto pendente neste mês.</p>;

  const bill = bills.find(({ id }) => id === billId);
  const isVariable = bill?.valueMode === "variable";
  const totalCents = (isVariable ? variableAmount : bill?.amountCents) ?? 0;

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="flex flex-col gap-4">
      <SelectField
        label="Boleto"
        name="billId"
        value={billId}
        onValueChange={(value) => {
          setBillId(value);
          setVariableAmount(null);
        }}
        options={toSelectOptions(bills)}
        errors={fieldErrors?.billId}
      />
      {isVariable && (
        <MoneyField
          key={billId}
          label="Valor pago neste mês"
          name="amount"
          onValueChange={setVariableAmount}
          errors={fieldErrors?.amount}
        />
      )}
      <PaymentTotalFooter totalCents={totalCents} pending={pending} disabled={!bill} error={error} />
    </form>
  );
};
