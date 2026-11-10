"use client";

import { FormError } from "@/shared/components/FormError";
import { FormField } from "@/shared/components/FormField";
import { Button } from "@/shared/components/ui/button";
import { useFormAction } from "@/shared/hooks/use-form-action";
import { submitWithoutReset } from "@/shared/utils/form";

import { signInAction } from "../actions/auth";

export const SignInForm = () => {
  const { formAction, pending, fieldErrors, error } = useFormAction(signInAction);

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="flex flex-col gap-4">
      <FormField label="Email" name="email" type="email" autoComplete="email" errors={fieldErrors?.email} />
      <FormField
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        errors={fieldErrors?.password}
      />
      <FormError error={error} />
      <Button type="submit" size="lg" disabled={pending}>
        Entrar
      </Button>
    </form>
  );
};
