"use client";

import { FormField } from "@/shared/components/FormField";
import { FormModal } from "@/shared/components/FormModal";
import { MoneyField } from "@/shared/components/MoneyInput";
import { SelectField } from "@/shared/components/SelectField";
import { SetupRequired } from "@/shared/components/SetupRequired";
import { useFormAction } from "@/shared/hooks/use-form-action";

import { createCardPurchaseAction, updateCardPurchaseAction } from "../actions/card-purchases";
import type { CardPurchase } from "../services/card-purchases";

type Option = { id: string; name: string };

type CardPurchaseFormModalProps = {
  purchase?: CardPurchase;
  categories: Option[];
  banks: Option[];
  onClose: () => void;
};

const toOptions = (records: Option[]) => records.map(({ id, name }) => ({ value: id, label: name }));

/** Cadastro prévio que falta (tipo, depois banco), ou undefined. */
const missingSetupFor = (categories: Option[], banks: Option[]) => {
  if (!categories.length) {
    return { message: "Cadastre um tipo antes de criar compras avulsas.", href: "/configuracoes/tipos", linkLabel: "Cadastrar tipo" };
  }
  if (!banks.length) {
    return { message: "Cadastre um banco antes de criar compras avulsas.", href: "/configuracoes/bancos", linkLabel: "Cadastrar banco" };
  }
};

export const CardPurchaseFormModal = ({ purchase, categories, banks, onClose }: CardPurchaseFormModalProps) => {
  const { formAction, pending, fieldErrors, error } = useFormAction(
    purchase ? updateCardPurchaseAction : createCardPurchaseAction,
    onClose,
  );

  const missingSetup = missingSetupFor(categories, banks);

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
            options={toOptions(banks)}
            errors={fieldErrors?.bankId}
          />
          <SelectField
            label="Tipo"
            name="categoryId"
            defaultValue={purchase?.category.id}
            options={toOptions(categories)}
            errors={fieldErrors?.categoryId}
          />
          <MoneyField label="Valor" name="amount" defaultValue={purchase?.amount_cents} errors={fieldErrors?.amount} />
        </>
      )}
    </FormModal>
  );
};
