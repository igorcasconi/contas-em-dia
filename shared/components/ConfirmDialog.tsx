"use client";

import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";

import { FormError } from "./FormError";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  error?: string;
  onConfirm: () => void;
};

/** Confirmação explícita. Permanece aberto até o consumidor fechar (permite exibir pending/erro). */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  destructive,
  pending,
  error,
  onConfirm,
}: ConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <FormError error={error} />
      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
        <Button variant={destructive ? "destructive" : "default"} disabled={pending} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
