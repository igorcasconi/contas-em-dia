"use client";

import type { ActionResult } from "@/shared/helpers/action-result";
import { useFormAction } from "@/shared/hooks/use-form-action";
import { useRecordDialogs } from "@/shared/hooks/use-record-dialogs";

import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState } from "./EmptyState";
import { Fab } from "./Fab";
import { FormField } from "./FormField";
import { FormModal } from "./FormModal";
import { RecordActions } from "./RecordActions";

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
  const { formAction, pending, fieldErrors, error } = useFormAction(item ? updateAction : createAction, onClose);

  return (
    <FormModal
      title={item ? `Editar ${entityLabel}` : `Novo ${entityLabel}`}
      open
      onOpenChange={(open) => !open && onClose()}
      action={formAction}
      pending={pending}
      error={error}
    >
      {item && <input type="hidden" name="id" value={item.id} />}
      <FormField label="Nome" name="name" defaultValue={item?.name} autoFocus errors={fieldErrors?.name} />
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
  const dialogs = useRecordDialogs<Item>(deleteAction);

  return (
    <>
      {items.length ? (
        <ul className="divide-y rounded-xl border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 py-1 pr-1 pl-4">
              <span>{item.name}</span>
              <RecordActions
                name={item.name}
                onEdit={() => dialogs.openForm(item)}
                onRemove={() => dialogs.askRemove(item)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState message={emptyMessage} />
      )}

      <Fab aria-label={`Novo ${entityLabel}`} onClick={() => dialogs.openForm()} />

      {/* Montado só enquanto aberto: cada abertura começa sem erro anterior */}
      {dialogs.editing && (
        <NameFormModal
          item={dialogs.editing.item}
          entityLabel={entityLabel}
          createAction={createAction}
          updateAction={updateAction}
          onClose={dialogs.closeForm}
        />
      )}

      <ConfirmDialog
        open={!!dialogs.removing}
        onOpenChange={(open) => !open && dialogs.cancelRemove()}
        title={`Excluir ${entityLabel}?`}
        description={`"${dialogs.removing?.name}" será excluído permanentemente.`}
        confirmLabel="Excluir"
        destructive
        pending={dialogs.removePending}
        error={dialogs.removeError}
        onConfirm={dialogs.confirmRemove}
      />
    </>
  );
};
