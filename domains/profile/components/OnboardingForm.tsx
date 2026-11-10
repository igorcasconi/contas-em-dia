"use client";

import { FormError } from "@/shared/components/FormError";
import { FormField } from "@/shared/components/FormField";
import { MoneyField } from "@/shared/components/MoneyInput";
import { Button } from "@/shared/components/ui/button";
import { useFormAction } from "@/shared/hooks/use-form-action";
import { submitWithoutReset } from "@/shared/utils/form";

import { completeOnboardingAction } from "../actions/profile";

export const OnboardingForm = () => {
  const { formAction, pending, fieldErrors, error } = useFormAction(completeOnboardingAction);

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="flex flex-col gap-4">
      <FormField label="Como podemos te chamar?" name="name" autoComplete="given-name" errors={fieldErrors?.name} />
      <MoneyField label="Salário líquido mensal" name="salary" hint="Vale a partir deste mês." errors={fieldErrors?.salary} />
      <FormError error={error} />
      <Button type="submit" size="lg" disabled={pending}>
        Começar
      </Button>
    </form>
  );
};
