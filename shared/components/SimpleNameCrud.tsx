"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { useActionState, useState, useTransition } from "react";

import type { ActionResult } from "@/shared/helpers/action-result";

import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState } from "./EmptyState";
import { Fab } from "./Fab";
import { FormField } from "./FormField";
import { FormModal } from "./FormModal";
import { Button } from "./ui/button";

type Item = { id: string; name: string };

type FormAction = (state: ActionResult | null, formData: FormData) => Promise<ActionResult>;

type SimpleNameCrudProps = {
  items: Item[];
  /** Substantivo masculino no singular, ex: "tipo", "banco". */
  entityLabel: string;
  emptyMessage: string;
  createAction: FormAction;
  updateAction: FormAction;
  deleteAction: (id: string) => Promise<ActionResult>;
};

type NameFormModalProps = Pick<SimpleNameCrudProps, "entityLabel" | "createAction" | "updateAction"> & {
  item?: Item;
  onClose: () => void;
};

const NameFormModal = ({ item, entityLabel, createAction, updateAction, onClose }: NameFormModalProps) => {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(async (previous, formData) => {
    const result = await (item ? updateAction : createAction)(previous, formData);
    if (result.ok) onClose();
    return result;
  }, null);
  const failure = state?.ok === false ? state : undefined;

  return (
    <FormModal
      title={item ? `Editar ${entityLabel}` : `Novo ${entityLabel}`}
      open
      onOpenChange={(open) => !open && onClose()}
      action={action}
      pending={pending}
      error={failure?.fieldErrors ? undefined : failure?.error}
    >
      {item && <input type="hidden" name="id" value={item.id} />}
      <FormField label="Nome" name="name" defaultValue={item?.name} autoFocus errors={failure?.fieldErrors?.name} />
    </FormModal>
  );
};

/** Lista + cadastro/edição/exclusão de entidades que têm só nome (Tipos, Bancos). */
export const SimpleNameCrud = ({
  items,
  entityLabel,
  emptyMessage,
  createAction,
  updateAction,
  deleteAction,
}: SimpleNameCrudProps) => {
  const [editing, setEditing] = useState<{ item?: Item }>();
  const [deleting, setDeleting] = useState<Item>();
  const [deleteError, setDeleteError] = useState<string>();
  const [deletePending, startDelete] = useTransition();

  const openForm = (item?: Item) => setEditing({ item });

  const confirmDelete = () =>
    startDelete(async () => {
      if (!deleting) return;
      const result = await deleteAction(deleting.id);
      if (result.ok) setDeleting(undefined);
      else setDeleteError(result.error);
    });

  return (
    <>
      {items.length ? (
        <ul className="divide-y rounded-xl border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 py-1 pr-1 pl-4">
              <span>{item.name}</span>
              <span className="flex">
                <Button variant="ghost" size="icon-lg" aria-label={`Editar ${item.name}`} onClick={() => openForm(item)}>
                  <PencilIcon aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label={`Excluir ${item.name}`}
                  onClick={() => {
                    setDeleteError(undefined);
                    setDeleting(item);
                  }}
                >
                  <Trash2Icon aria-hidden />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState message={emptyMessage} />
      )}

      <Fab aria-label={`Novo ${entityLabel}`} onClick={() => openForm()} />

      {/* Montado só enquanto aberto: cada abertura começa sem erro anterior */}
      {editing && (
        <NameFormModal
          item={editing.item}
          entityLabel={entityLabel}
          createAction={createAction}
          updateAction={updateAction}
          onClose={() => setEditing(undefined)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title={`Excluir ${entityLabel}?`}
        description={`"${deleting?.name}" será excluído permanentemente.`}
        confirmLabel="Excluir"
        destructive
        pending={deletePending}
        error={deleteError}
        onConfirm={confirmDelete}
      />
    </>
  );
};
