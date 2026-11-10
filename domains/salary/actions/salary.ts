"use server";

import { fromZodError } from "@/shared/helpers/action-result";
import { mutationResult } from "@/shared/helpers/mutation-result";
import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";

import { salarySchema } from "../schemas/salary";

export const updateSalaryAction = async (amountCents: number) => {
  const parsed = salarySchema.safeParse({ amountCents });
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_salary", { p_amount_cents: parsed.data.amountCents });
  return mutationResult(error);
};
