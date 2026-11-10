"use client";

import { type ComponentProps, useState } from "react";

import { Input } from "@/shared/components/ui/input";
import { formatBRL } from "@/shared/utils/money";

import { FieldShell } from "./FormField";

const MAX_DIGITS = 11;

type MoneyInputProps = Omit<ComponentProps<typeof Input>, "type" | "value" | "defaultValue" | "onChange"> & {
  /** Valor inicial em centavos. */
  defaultValue?: number | null;
  onValueChange?: (cents: number | null) => void;
};

/** Input com máscara BRL: digita só números ("12345" → "R$ 123,45"). Envia o texto formatado no form. */
export const MoneyInput = ({ defaultValue = null, onValueChange, ...inputProps }: MoneyInputProps) => {
  const [cents, setCents] = useState(defaultValue);

  return (
    <Input
      inputMode="numeric"
      placeholder="R$ 0,00"
      {...inputProps}
      value={cents === null ? "" : formatBRL(cents)}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, MAX_DIGITS);
        const next = digits ? Number(digits) : null;
        setCents(next);
        onValueChange?.(next);
      }}
    />
  );
};

type MoneyFieldProps = MoneyInputProps & {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
};

export const MoneyField = ({ label, name, errors, hint, ...inputProps }: MoneyFieldProps) => (
  <FieldShell label={label} name={name} errors={errors} hint={hint}>
    {(controlProps) => <MoneyInput {...controlProps} {...inputProps} />}
  </FieldShell>
);
