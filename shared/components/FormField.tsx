"use client";

import { type ComponentProps, type ReactNode, useId } from "react";

import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type ControlProps = {
  id: string;
  name: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
};

type FieldShellProps = {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
  children: (controlProps: ControlProps) => ReactNode;
};

/**
 * Label + controle + dica/erro, com ids de acessibilidade ligados.
 * Ids via useId: rotas anteriores ficam montadas (cacheComponents), então ids derivados de `name` colidiriam.
 */
export const FieldShell = ({ label, name, errors, hint, children }: FieldShellProps) => {
  const id = useId();
  const errorId = `${id}-error`;
  const hasError = !!errors?.length;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        name,
        "aria-invalid": hasError,
        "aria-describedby": hasError ? errorId : undefined,
      })}
      {hasError ? (
        <p id={errorId} className="text-sm text-destructive">
          {errors[0]}
        </p>
      ) : (
        hint && <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
};

type FormFieldProps = ComponentProps<typeof Input> & Omit<FieldShellProps, "children">;

export const FormField = ({ label, name, errors, hint, ...inputProps }: FormFieldProps) => (
  <FieldShell label={label} name={name} errors={errors} hint={hint}>
    {(controlProps) => <Input {...controlProps} {...inputProps} />}
  </FieldShell>
);
