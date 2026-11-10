import { PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "./ui/button";

type RecordActionsProps = {
  name: string;
  onEdit: () => void;
  onRemove: () => void;
  removeVerb?: string;
};

/** Botões de editar/remover de uma linha de lista, com rótulos acessíveis por registro. */
export const RecordActions = ({ name, onEdit, onRemove, removeVerb = "Excluir" }: RecordActionsProps) => (
  <span className="flex shrink-0">
    <Button variant="ghost" size="icon-lg" aria-label={`Editar ${name}`} onClick={onEdit}>
      <PencilIcon aria-hidden />
    </Button>
    <Button variant="ghost" size="icon-lg" aria-label={`${removeVerb} ${name}`} onClick={onRemove}>
      <Trash2Icon aria-hidden />
    </Button>
  </span>
);
