"use client";

import { useActionState } from "react";

import { FormField } from "@/shared/components/FormField";
import { Button } from "@/shared/components/ui/button";

import { signInAction } from "../actions/auth";

export const SignInForm = () => {
  const [state, action, pending] = useActionState(signInAction, null);
  const failure = state?.ok === false ? state : undefined;

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField label="Email" name="email" type="email" autoComplete="email" errors={failure?.fieldErrors?.email} />
      <FormField
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        errors={failure?.fieldErrors?.password}
      />
      {failure && !failure.fieldErrors && (
        <p role="alert" className="text-sm text-destructive">
          {failure.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        Entrar
      </Button>
    </form>
  );
};
