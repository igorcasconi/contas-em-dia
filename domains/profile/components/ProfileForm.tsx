"use client";

import { useActionState } from "react";

import { FormField } from "@/shared/components/FormField";
import { Button } from "@/shared/components/ui/button";

import { updateNameAction } from "../actions/profile";

export const ProfileForm = ({ name }: { name: string }) => {
  const [state, action, pending] = useActionState(updateNameAction, null);
  const failure = state?.ok === false ? state : undefined;

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField label="Nome" name="name" defaultValue={name} errors={failure?.fieldErrors?.name} />
      {failure && !failure.fieldErrors && (
        <p role="alert" className="text-sm text-destructive">
          {failure.error}
        </p>
      )}
      {state?.ok && (
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
