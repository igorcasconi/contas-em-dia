"use client";

import { FormField } from "@/shared/components/FormField";
import { FormModal } from "@/shared/components/FormModal";
import { MoneyField } from "@/shared/components/MoneyInput";
import { SelectField } from "@/shared/components/SelectField";
import { SetupRequired } from "@/shared/components/SetupRequired";
import { missingCategoryOrBank } from "@/shared/helpers/missing-setup";
import { useFormAction } from "@/shared/hooks/use-form-action";
import { type NamedRecord, toSelectOptions } from "@/shared/utils/select-options";

import { createCardPurchaseAction, updateCardPurchaseAction } from "../actions/card-purchases";
import type { CardPurchase } from "../services/card-purchases";

type CardPurchaseFormModalProps = {
  purchase?: CardPurchase;
  categories: NamedRecord[];
  banks: NamedRecord[];
  onClose: () => void;
};

export const CardPurchaseFormModal = ({ purchase, categories, banks, onClose }: CardPurchaseFormModalProps) => {
  const { formAction, pending, fieldErrors, error } = useFormAction(
    purchase ? updateCardPurchaseAction : createCardPurchaseAction,
    onClose,
  );

  const missingSetup = missingCategoryOrBank(categories, banks, "compras avulsas");

  return (
    <FormModal
      title={purchase ? "Editar compra avulsa" : "Nova compra avulsa"}
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
          {purchase && <input type="hidden" name="id" value={purchase.id} />}
          <FormField label="Descrição" name="name" defaultValue={purchase?.name} errors={fieldErrors?.name} />
          <SelectField
            label="Banco"
            name="bankId"
            defaultValue={purchase?.bank.id}
            options={toSelectOptions(banks)}
            errors={fieldErrors?.bankId}
          />
          <SelectField
            label="Tipo"
            name="categoryId"
            defaultValue={purchase?.category.id}
            options={toSelectOptions(categories)}
            errors={fieldErrors?.categoryId}
          />
          <MoneyField label="Valor" name="amount" defaultValue={purchase?.amount_cents} errors={fieldErrors?.amount} />
        </>
      )}
    </FormModal>
  );
};
