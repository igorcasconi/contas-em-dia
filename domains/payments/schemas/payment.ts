import { z } from "zod";

import { moneyField } from "@/shared/utils/money";

/** Boleto fixo não envia valor (RPC usa o cadastro); variável envia o valor do mês. */
export const payBillSchema = z.object({
  billId: z.uuid("Selecione o boleto"),
  amount: moneyField.optional(),
});

export const payCardSchema = z.object({
  bankId: z.uuid("Selecione o banco"),
  // Vazio é válido (banco só com avulsos); "ao menos um item" é regra do pay_card
  items: z.array(z.object({ cardItemId: z.uuid(), included: z.boolean(), pause: z.boolean().default(false) })),
});

export type PayCardInput = z.input<typeof payCardSchema>;
