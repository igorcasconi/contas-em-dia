"use server";

import type { z } from "zod";

import { type ActionResult, fromZodError } from "@/shared/helpers/action-result";
import { mutationResult } from "@/shared/helpers/mutation-result";
import { INVALID_RECORD, isRecordId } from "@/shared/helpers/record-id";
import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";

import { cardItemSchema, cardItemUpdateSchema } from "../schemas/card-item";

const toRow = (item: z.infer<typeof cardItemSchema>) => ({
  name: item.name,
  category_id: item.categoryId,
  bank_id: item.bankId,
  amount_cents: item.amount,
  remaining_months: item.remainingMonths,
  // Parcelado nunca fica pausado
  ...(item.remainingMonths !== null && { status: "active" }),
});

export const createCardItemAction = async (_state: ActionResult | null, formData: FormData) => {
  const parsed = cardItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from("card_items").insert(toRow(parsed.data));
  return mutationResult(error);
};

export const updateCardItemAction = async (_state: ActionResult | null, formData: FormData) => {
  const parsed = cardItemUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from("card_items").update(toRow(parsed.data)).eq("id", parsed.data.id);
  return mutationResult(error);
};

/** Encerra a recorrência; pagamentos anteriores continuam no histórico. */
export const endCardItemAction = async (id: string) => {
  if (!isRecordId(id)) return INVALID_RECORD;

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from("card_items").update({ ended_at: new Date().toISOString() }).eq("id", id);
  return mutationResult(error);
};
