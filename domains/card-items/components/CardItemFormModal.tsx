"use client";

import { useState } from "react";

import { FormField } from "@/shared/components/FormField";
import { FormModal } from "@/shared/components/FormModal";
import { MoneyField } from "@/shared/components/MoneyInput";
import { SelectField } from "@/shared/components/SelectField";
import { SetupRequired } from "@/shared/components/SetupRequired";
import { missingCategoryOrBank } from "@/shared/helpers/missing-setup";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { useFormAction } from "@/shared/hooks/use-form-action";
import { type NamedRecord, toSelectOptions } from "@/shared/utils/select-options";

import { createCardItemAction, updateCardItemAction } from "../actions/card-items";
import type { ActiveCardItem } from "../services/card-items";

type CardItemFormModalProps = {
  item?: ActiveCardItem;
  categories: NamedRecord[];
  banks: NamedRecord[];
  onClose: () => void;
};

export const CardItemFormModal = ({ item, categories, banks, onClose }: CardItemFormModalProps) => {
  const [alwaysRecurring, setAlwaysRecurring] = useState(item ? item.remaining_months === null : true);
  const { formAction, pending, fieldErrors, error } = useFormAction(
    item ? updateCardItemAction : createCardItemAction,
    onClose,
  );

  const missingSetup = missingCategoryOrBank(categories, banks, "itens do cartão");

  return (
    <FormModal
      title={item ? "Editar item do cartão" : "Novo item do cartão"}
      open
      onOpenChange={(open) => !open && onClose()}
      action={formAction}
      pending={pending}
      error={error}
      submitDisabled={!!missingSetup}
    >
      {missingSetup ? (
        <SetupRequired {...missingSetup} />
      ) : (
        <>
          {item && <input type="hidden" name="id" value={item.id} />}
          <FormField label="Nome" name="name" defaultValue={item?.name} errors={fieldErrors?.name} />
          <SelectField
            label="Tipo"
            name="categoryId"
            defaultValue={item?.category.id}
            options={toSelectOptions(categories)}
            errors={fieldErrors?.categoryId}
          />
          <SelectField
            label="Banco"
            name="bankId"
            defaultValue={item?.bank.id}
            options={toSelectOptions(banks)}
            errors={fieldErrors?.bankId}
          />
          <MoneyField label="Valor mensal" name="amount" defaultValue={item?.amount_cents} errors={fieldErrors?.amount} />
          <div className="flex items-center gap-2">
            <Checkbox
              id="alwaysRecurring"
              name="alwaysRecurring"
              checked={alwaysRecurring}
              onCheckedChange={(checked) => setAlwaysRecurring(checked === true)}
            />
            <Label htmlFor="alwaysRecurring">Sempre recorrente</Label>
          </div>
          {!alwaysRecurring && (
            <FormField
              label="Meses restantes"
              name="remainingMonths"
              type="number"
              inputMode="numeric"
              min={1}
              defaultValue={item?.remaining_months ?? undefined}
              errors={fieldErrors?.remainingMonths}
            />
          )}
        </>
      )}
    </FormModal>
  );
};
