"use client";

import { useActionState, useState, useTransition } from "react";

import type { ActionResult } from "@/shared/helpers/action-result";

type FormAction = (state: ActionResult | null, formData: FormData) => Promise<ActionResult>;

/** Estado de modal de criação/edição + confirmação de remoção de uma lista de registros. */
export const useRecordDialogs = <T extends { id: string }>(removeAction: (id: string) => Promise<ActionResult>) => {
  const [editing, setEditing] = useState<{ item?: T }>();
  const [removing, setRemoving] = useState<T>();
  const [removeError, setRemoveError] = useState<string>();
  const [removePending, startRemove] = useTransition();

  return {
    editing,
    openForm: (item?: T) => setEditing({ item }),
    closeForm: () => setEditing(undefined),
    removing,
    removePending,
    removeError,
    askRemove: (item: T) => {
      setRemoveError(undefined);
      setRemoving(item);
    },
    cancelRemove: () => setRemoving(undefined),
    confirmRemove: () =>
      startRemove(async () => {
        if (!removing) return;
        const result = await removeAction(removing.id);
        if (result.ok) setRemoving(undefined);
        else setRemoveError(result.error);
      }),
  };
};

/** useActionState que fecha o modal quando a action dá certo. */
export const useModalFormAction = (action: FormAction, onSuccess: () => void) => {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (result.ok) onSuccess();
    return result;
  }, null);
  const failure = state?.ok === false ? state : undefined;

  return {
    formAction,
    pending,
    fieldErrors: failure?.fieldErrors,
    /** Erro geral (sem erros de campo), para exibir no rodapé do modal. */
    error: failure?.fieldErrors ? undefined : failure?.error,
  };
};
