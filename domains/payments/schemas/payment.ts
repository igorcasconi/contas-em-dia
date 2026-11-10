import { z } from "zod";

import { moneyField } from "@/shared/utils/money";

/** Boleto fixo não envia valor (RPC usa o cadastro); variável envia o valor do mês. */
export const payBillSchema = z.object({
  billId: z.uuid("Selecione o boleto"),
  amount: moneyField.optional(),
});

export const payCardSchema = z.object({
  bankId: z.uuid("Selecione o banco"),
  items: z
    .array(z.object({ cardItemId: z.uuid(), included: z.boolean(), pause: z.boolean().default(false) }))
    .refine((items) => items.some(({ included }) => included), "Selecione ao menos um item."),
});

export type PayCardInput = z.input<typeof payCardSchema>;
