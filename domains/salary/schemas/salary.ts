import { z } from "zod";

export const salarySchema = z.object({
  amountCents: z.number().int().positive("Informe um valor maior que zero"),
});
