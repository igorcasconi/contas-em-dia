import { z } from "zod";

import { moneyField } from "@/shared/utils/money";

const nameField = z.string().trim().min(1, "Informe seu nome");

export const onboardingSchema = z.object({
  name: nameField,
  salary: moneyField,
});
