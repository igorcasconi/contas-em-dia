"use client";

import { FieldShell } from "./FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type SelectFieldProps = {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string;
  /** Modo controlado (opcional). */
  value?: string;
  onValueChange?: (value: string) => void;
  errors?: string[];
};

/** Select acessível que participa do form (Radix renderiza um select nativo oculto com `name`). */
export const SelectField = ({
  label,
  name,
  options,
  placeholder = "Selecione",
  defaultValue,
  value,
  onValueChange,
  errors,
}: SelectFieldProps) => (
  <FieldShell label={label} name={name} errors={errors}>
    {({ id, ...ariaProps }) => (
      <Select name={name} defaultValue={defaultValue} value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-full" {...ariaProps}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  </FieldShell>
);
