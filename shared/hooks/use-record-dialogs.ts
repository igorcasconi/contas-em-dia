import { useState, useTransition } from "react";

import type { ActionResult } from "@/shared/helpers/action-result";
import { callAction } from "@/shared/helpers/call-action";

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
        const result = await callAction(() => removeAction(removing.id));
        if (result.ok) setRemoving(undefined);
        else setRemoveError(result.error);
      }),
  };
};
