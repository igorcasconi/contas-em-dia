"use server";

import { type ActionResult, fromZodError } from "@/shared/helpers/action-result";
import { mutationResult } from "@/shared/helpers/mutation-result";
import { INVALID_RECORD, isRecordId } from "@/shared/helpers/record-id";
import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";

import { type PayCardInput, payBillSchema, payCardSchema } from "../schemas/payment";

export const payBillAction = async (_state: ActionResult | null, formData: FormData) => {
  const parsed = payBillSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.rpc("pay_bill", {
    p_bill_id: parsed.data.billId,
    p_amount_cents: parsed.data.amount,
  });
  return mutationResult(error);
};

export const payCardAction = async (input: PayCardInput) => {
  const parsed = payCardSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.rpc("pay_card", {
    p_bank_id: parsed.data.bankId,
    p_items: parsed.data.items.map(({ cardItemId, included, pause }) => ({ card_item_id: cardItemId, included, pause })),
  });
  return mutationResult(error);
};

export const undoPaymentAction = async (paymentId: string) => {
  if (!isRecordId(paymentId)) return INVALID_RECORD;

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.rpc("undo_payment", { p_payment_id: paymentId });
  return mutationResult(error);
};
