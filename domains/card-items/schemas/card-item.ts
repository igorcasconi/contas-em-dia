import { z } from "zod";

import { moneyField } from "@/shared/utils/money";

const fields = {
  name: z.string().trim().min(1, "Informe o nome"),
  categoryId: z.uuid("Selecione um tipo"),
  bankId: z.uuid("Selecione um banco"),
  amount: moneyField,
  /** Checkbox: "on" quando marcado, ausente quando não. */
  alwaysRecurring: z.literal("on").optional(),
  remainingMonths: z.string().optional(),
};

/** `remainingMonths: null` = sempre recorrente; número ≥ 1 = parcelas restantes. */
const normalizeRecurrence = <T extends { alwaysRecurring?: "on"; remainingMonths?: string }>(
  { alwaysRecurring, remainingMonths, ...item }: T,
  ctx: z.RefinementCtx,
) => {
  if (alwaysRecurring) return { ...item, remainingMonths: null };

  const months = Number(remainingMonths);
  if (remainingMonths && Number.isInteger(months) && months >= 1) return { ...item, remainingMonths: months };

  ctx.addIssue({ code: "custom", path: ["remainingMonths"], message: "Informe os meses restantes (mínimo 1)" });
  return z.NEVER;
};

export const cardItemSchema = z.object(fields).transform(normalizeRecurrence);

export const cardItemUpdateSchema = z.object({ ...fields, id: z.uuid() }).transform(normalizeRecurrence);
