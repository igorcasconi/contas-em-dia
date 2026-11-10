"use client";

import { useState } from "react";

import { FormField } from "@/shared/components/FormField";
import { FormModal } from "@/shared/components/FormModal";
import { MoneyField } from "@/shared/components/MoneyInput";
import { SelectField } from "@/shared/components/SelectField";
import { SetupRequired } from "@/shared/components/SetupRequired";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { useFormAction } from "@/shared/hooks/use-form-action";

import { createBillAction, updateBillAction } from "../actions/bills";
import type { ActiveBill } from "../services/bills";

const VALUE_MODES = [
  { value: "fixed", label: "Fixo" },
  { value: "variable", label: "Variável" },
];

type BillFormModalProps = {
  bill?: ActiveBill;
  categories: { id: string; name: string }[];
  onClose: () => void;
};

export const BillFormModal = ({ bill, categories, onClose }: BillFormModalProps) => {
  const [valueMode, setValueMode] = useState(bill?.value_mode ?? "fixed");
  const { formAction, pending, fieldErrors, error } = useFormAction(
    bill ? updateBillAction : createBillAction,
    onClose,
  );
  const hasCategories = categories.length > 0;

  return (
    <FormModal
      title={bill ? "Editar boleto" : "Novo boleto"}
      open
      onOpenChange={(open) => !open && onClose()}
      action={formAction}
      pending={pending}
      error={error}
      submitDisabled={!hasCategories}
    >
      {hasCategories ? (
        <>
          {bill && <input type="hidden" name="id" value={bill.id} />}
          <FormField label="Nome" name="name" defaultValue={bill?.name} errors={fieldErrors?.name} />
          <SelectField
            label="Tipo"
            name="categoryId"
            defaultValue={bill?.category.id}
            options={categories.map(({ id, name }) => ({ value: id, label: name }))}
            errors={fieldErrors?.categoryId}
          />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Valor</legend>
            <RadioGroup name="valueMode" value={valueMode} onValueChange={setValueMode} className="flex gap-6">
              {VALUE_MODES.map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <RadioGroupItem id={`valueMode-${value}`} value={value} />
                  <Label htmlFor={`valueMode-${value}`}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
          {valueMode === "fixed" && (
            <MoneyField
              label="Valor mensal"
              name="amount"
              defaultValue={bill?.amount_cents}
              errors={fieldErrors?.amount}
            />
          )}
        </>
      ) : (
        <SetupRequired
          message="Cadastre um tipo antes de criar boletos."
          href="/configuracoes/tipos"
          linkLabel="Cadastrar tipo"
        />
      )}
    </FormModal>
  );
};
