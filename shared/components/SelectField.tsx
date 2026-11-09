"use client";

import { FieldShell } from "./FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type SelectFieldProps = {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string;
  errors?: string[];
};

/** Select acessível que participa do form (Radix renderiza um select nativo oculto com `name`). */
export const SelectField = ({ label, name, options, placeholder = "Selecione", defaultValue, errors }: SelectFieldProps) => (
  <FieldShell label={label} name={name} errors={errors}>
    {({ id, ...ariaProps }) => (
      <Select name={name} defaultValue={defaultValue}>
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
