import { z } from "zod";

import { moneyField } from "@/shared/utils/money";

const nameField = z.string().trim().min(1, "Informe seu nome").max(100, "Use no máximo 100 caracteres");

export const onboardingSchema = z.object({
  name: nameField,
  salary: moneyField,
});

export const profileSchema = z.object({ name: nameField });
