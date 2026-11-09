import type { ComponentProps } from "react";

import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type FormFieldProps = ComponentProps<typeof Input> & {
  label: string;
  name: string;
  errors?: string[];
};

export const FormField = ({ label, name, errors, ...inputProps }: FormFieldProps) => {
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        aria-invalid={!!errors?.length}
        aria-describedby={errors?.length ? errorId : undefined}
        {...inputProps}
      />
      {errors?.length ? (
        <p id={errorId} className="text-sm text-destructive">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
};
