"use client";

import { type FormEvent, useState, useTransition } from "react";

import { FormError } from "@/shared/components/FormError";
import { MoneyField } from "@/shared/components/MoneyInput";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { callAction } from "@/shared/helpers/call-action";
import { formatBRL } from "@/shared/utils/money";

import { updateSalaryAction } from "../actions/salary";

type UpdateSalaryDialogProps = {
  currentCents: number;
  monthLabel: string;
  onClose: () => void;
};

/** Passo 1: novo valor. Passo 2: aviso de confirmação (de → para). */
export const UpdateSalaryDialog = ({ currentCents, monthLabel, onClose }: UpdateSalaryDialogProps) => {
  const [step, setStep] = useState<"edit" | "confirm">("edit");
  const [amountCents, setAmountCents] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startUpdate] = useTransition();

  const goToConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (amountCents) setStep("confirm");
  };

  const confirm = () =>
    startUpdate(async () => {
      if (!amountCents) return;
      const result = await callAction(() => updateSalaryAction(amountCents));
      if (result.ok) onClose();
      else setError(result.error);
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {step === "edit" ? (
          <form onSubmit={goToConfirm} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Atualizar salário</DialogTitle>
            </DialogHeader>
            <MoneyField
              label="Novo salário líquido"
              name="salary"
              defaultValue={amountCents}
              onValueChange={setAmountCents}
              hint={`Vale de ${monthLabel} em diante.`}
              autoFocus
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!amountCents}>
                Continuar
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirmar alteração</DialogTitle>
              <DialogDescription>
                O salário passará de {formatBRL(currentCents)} para {formatBRL(amountCents ?? 0)} a partir de{" "}
                {monthLabel}.
              </DialogDescription>
            </DialogHeader>
            <FormError error={error} />
            <DialogFooter>
              <Button type="button" variant="outline" disabled={pending} onClick={() => setStep("edit")}>
                Voltar
              </Button>
              <Button type="button" disabled={pending} onClick={confirm}>
                Confirmar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
