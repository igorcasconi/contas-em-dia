"use client";

import { useActionState } from "react";

import { FormField } from "@/shared/components/FormField";
import { MoneyField } from "@/shared/components/MoneyInput";
import { Button } from "@/shared/components/ui/button";
import { submitWithoutReset } from "@/shared/utils/form";

import { completeOnboardingAction } from "../actions/profile";

export const OnboardingForm = () => {
  const [state, action, pending] = useActionState(completeOnboardingAction, null);
  const failure = state?.ok === false ? state : undefined;

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-4">
      <FormField label="Como podemos te chamar?" name="name" autoComplete="given-name" errors={failure?.fieldErrors?.name} />
      <MoneyField
        label="Salário líquido mensal"
        name="salary"
        hint="Vale a partir deste mês."
        errors={failure?.fieldErrors?.salary}
      />
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
