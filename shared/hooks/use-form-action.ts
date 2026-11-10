import { useActionState } from "react";

import type { ActionResult } from "@/shared/helpers/action-result";
import { callAction } from "@/shared/helpers/call-action";

type FormAction = (state: ActionResult | null, formData: FormData) => Promise<ActionResult>;

/**
 * useActionState para formulários: falha de rede vira erro exibível e `onSuccess` roda quando a action dá certo
 * (ex: fechar o modal). Expõe erros de campo e o erro geral (quando não há erro de campo).
 */
export const useFormAction = (action: FormAction, onSuccess?: () => void) => {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(async (previous, formData) => {
    const result = await callAction(() => action(previous, formData));
    if (result.ok) onSuccess?.();
    return result;
  }, null);
  const failure = state?.ok === false ? state : undefined;

  return {
    formAction,
    pending,
    succeeded: state?.ok === true,
    fieldErrors: failure?.fieldErrors,
    error: failure?.fieldErrors ? undefined : failure?.error,
  };
};
