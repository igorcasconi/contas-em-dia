"use client";

import { useActionState } from "react";

import { FormField } from "@/shared/components/FormField";
import { Button } from "@/shared/components/ui/button";

import { signUpAction } from "../actions/auth";

export const SignUpForm = () => {
  const [state, action, pending] = useActionState(signUpAction, null);
  const failure = state?.ok === false ? state : undefined;

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField label="Email" name="email" type="email" autoComplete="email" errors={failure?.fieldErrors?.email} />
      <FormField
        label="Senha"
        name="password"
        type="password"
        autoComplete="new-password"
        errors={failure?.fieldErrors?.password}
      />
      <FormField
        label="Confirmar senha"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        errors={failure?.fieldErrors?.confirmPassword}
      />
      {failure && !failure.fieldErrors && (
        <p role="alert" className="text-sm text-destructive">
          {failure.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        Criar conta
      </Button>
    </form>
  );
};
