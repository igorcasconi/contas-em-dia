"use client";

import type { ReactNode } from "react";

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

type FormModalProps = {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
  submitLabel?: string;
  children: ReactNode;
};

/** Modal de cadastro/edição. O consumidor controla `open` e fecha após sucesso da action. */
export const FormModal = ({
  title,
  description,
  open,
  onOpenChange,
  action,
  pending,
  error,
  submitLabel = "Salvar",
  children,
}: FormModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <form action={action} className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={pending}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);
