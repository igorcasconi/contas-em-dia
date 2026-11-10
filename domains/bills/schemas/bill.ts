import { z } from "zod";

import { moneyField } from "@/shared/utils/money";

const billBase = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(100, "Use no máximo 100 caracteres"),
  categoryId: z.uuid("Selecione um tipo"),
});

export const billSchema = z.discriminatedUnion(
  "valueMode",
  [billBase.extend({ valueMode: z.literal("fixed"), amount: moneyField }), billBase.extend({ valueMode: z.literal("variable") })],
  { error: "Selecione fixo ou variável" },
);

export const billUpdateSchema = z.intersection(z.object({ id: z.uuid() }), billSchema);
