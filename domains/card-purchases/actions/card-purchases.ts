"use server";

import type { z } from "zod";

import { type ActionResult, fromZodError } from "@/shared/helpers/action-result";
import { mutationResult } from "@/shared/helpers/mutation-result";
import { INVALID_RECORD, isRecordId } from "@/shared/helpers/record-id";
import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";

import { cardPurchaseSchema, cardPurchaseUpdateSchema } from "../schemas/card-purchase";

// Mês é definido pelo trigger do banco (sempre o mês atual)
const toRow = (purchase: z.infer<typeof cardPurchaseSchema>) => ({
  name: purchase.name,
  category_id: purchase.categoryId,
  bank_id: purchase.bankId,
  amount_cents: purchase.amount,
});

export const createCardPurchaseAction = async (_state: ActionResult | null, formData: FormData) => {
  const parsed = cardPurchaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from("card_purchases").insert(toRow(parsed.data));
  return mutationResult(error);
};

export const updateCardPurchaseAction = async (_state: ActionResult | null, formData: FormData) => {
  const parsed = cardPurchaseUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from("card_purchases").update(toRow(parsed.data)).eq("id", parsed.data.id);
  return mutationResult(error);
};

export const deleteCardPurchaseAction = async (id: string) => {
  if (!isRecordId(id)) return INVALID_RECORD;

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from("card_purchases").delete().eq("id", id);
  return mutationResult(error);
};
