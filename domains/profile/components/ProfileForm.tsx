"use client";

import { FormError } from "@/shared/components/FormError";
import { FormField } from "@/shared/components/FormField";
import { Button } from "@/shared/components/ui/button";
import { useFormAction } from "@/shared/hooks/use-form-action";
import { submitWithoutReset } from "@/shared/utils/form";

import { updateNameAction } from "../actions/profile";

export const ProfileForm = ({ name }: { name: string }) => {
  const { formAction, pending, succeeded, fieldErrors, error } = useFormAction(updateNameAction);

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="flex flex-col gap-4">
      <FormField label="Nome" name="name" defaultValue={name} errors={fieldErrors?.name} />
      <FormError error={error} />
      {succeeded && (
        <p role="status" className="text-sm text-muted-foreground">
          Nome atualizado.
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        Salvar
      </Button>
    </form>
  );
};
