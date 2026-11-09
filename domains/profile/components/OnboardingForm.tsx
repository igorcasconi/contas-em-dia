"use client";

import { useActionState } from "react";

import { FormField } from "@/shared/components/FormField";
import { Button } from "@/shared/components/ui/button";

import { completeOnboardingAction } from "../actions/profile";

export const OnboardingForm = () => {
  const [state, action, pending] = useActionState(completeOnboardingAction, null);
  const failure = state?.ok === false ? state : undefined;

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField label="Como podemos te chamar?" name="name" autoComplete="given-name" errors={failure?.fieldErrors?.name} />
      <div className="flex flex-col gap-1">
        <FormField
          label="Salário líquido mensal"
          name="salary"
          inputMode="decimal"
          placeholder="R$ 0,00"
          errors={failure?.fieldErrors?.salary}
        />
        <p className="text-sm text-muted-foreground">Vale a partir deste mês.</p>
      </div>
      {failure && !failure.fieldErrors && (
        <p role="alert" className="text-sm text-destructive">
          {failure.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        Começar
      </Button>
    </form>
  );
};
