"use client";

import { FormError } from "@/shared/components/FormError";
import { FormField } from "@/shared/components/FormField";
import { Button } from "@/shared/components/ui/button";
import { useFormAction } from "@/shared/hooks/use-form-action";
import { submitWithoutReset } from "@/shared/utils/form";

import { signUpAction } from "../actions/auth";

export const SignUpForm = () => {
  const { formAction, pending, fieldErrors, error } = useFormAction(signUpAction);

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="flex flex-col gap-4">
      <FormField label="Email" name="email" type="email" autoComplete="email" errors={fieldErrors?.email} />
      <FormField
        label="Senha"
        name="password"
        type="password"
        autoComplete="new-password"
        errors={fieldErrors?.password}
      />
      <FormField
        label="Confirmar senha"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        errors={fieldErrors?.confirmPassword}
      />
      <FormError error={error} />
      <Button type="submit" size="lg" disabled={pending}>
        Criar conta
      </Button>
    </form>
  );
};
