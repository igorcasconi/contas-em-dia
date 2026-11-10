"use client";

import { PencilIcon } from "lucide-react";
import { useState } from "react";

import { MoneyText } from "@/shared/components/MoneyText";
import { Button } from "@/shared/components/ui/button";

import { UpdateSalaryDialog } from "./UpdateSalaryDialog";

type SalaryCardProps = {
  salaryCents: number;
  /** Há pagamento no mês: alteração bloqueada. */
  locked: boolean;
  monthLabel: string;
};

export const SalaryCard = ({ salaryCents, locked, monthLabel }: SalaryCardProps) => {
  const [editing, setEditing] = useState(false);

  return (
    <section aria-label="Salário" className="flex flex-col gap-1 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">Salário</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Atualizar salário"
          aria-describedby={locked ? "salary-locked" : undefined}
          disabled={locked}
          onClick={() => setEditing(true)}
        >
          <PencilIcon aria-hidden />
        </Button>
      </div>
      <MoneyText cents={salaryCents} className="text-xl font-semibold" />
      {locked && (
        <p id="salary-locked" className="text-xs text-muted-foreground">
          Desfaça os pagamentos do mês para alterar o salário.
        </p>
      )}
      {editing && (
        <UpdateSalaryDialog currentCents={salaryCents} monthLabel={monthLabel} onClose={() => setEditing(false)} />
      )}
    </section>
  );
};
