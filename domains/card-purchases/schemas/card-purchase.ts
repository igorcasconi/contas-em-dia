import { z } from "zod";

import { moneyField } from "@/shared/utils/money";

export const cardPurchaseSchema = z.object({
  name: z.string().trim().min(1, "Informe a descrição").max(100, "Use no máximo 100 caracteres"),
  categoryId: z.uuid("Selecione um tipo"),
  bankId: z.uuid("Selecione um banco"),
  amount: moneyField,
});

export const cardPurchaseUpdateSchema = cardPurchaseSchema.extend({ id: z.uuid() });
