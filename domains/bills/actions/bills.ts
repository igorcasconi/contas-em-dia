"use server";

import type { z } from "zod";

import { type ActionResult, fromZodError } from "@/shared/helpers/action-result";
import { mutationResult } from "@/shared/helpers/mutation-result";
import { INVALID_RECORD, isRecordId } from "@/shared/helpers/record-id";
import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";

import { billSchema, billUpdateSchema } from "../schemas/bill";

const toRow = (bill: z.infer<typeof billSchema>) => ({
  name: bill.name,
  category_id: bill.categoryId,
  value_mode: bill.valueMode,
  amount_cents: bill.valueMode === "fixed" ? bill.amount : null,
});

export const createBillAction = async (_state: ActionResult | null, formData: FormData) => {
  const parsed = billSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from("bills").insert(toRow(parsed.data));
  return mutationResult(error);
};

export const updateBillAction = async (_state: ActionResult | null, formData: FormData) => {
  const parsed = billUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from("bills").update(toRow(parsed.data)).eq("id", parsed.data.id);
  return mutationResult(error);
};

/** Encerra a recorrência; pagamentos anteriores continuam no histórico. */
export const endBillAction = async (id: string) => {
  if (!isRecordId(id)) return INVALID_RECORD;

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from("bills").update({ ended_at: new Date().toISOString() }).eq("id", id);
  return mutationResult(error);
};
