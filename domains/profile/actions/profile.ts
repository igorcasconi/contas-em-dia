"use server";

import { redirect } from "next/navigation";

import { type ActionResult, fromZodError, mapDbError } from "@/shared/helpers/action-result";
import { mutationResult } from "@/shared/helpers/mutation-result";
import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";

import { onboardingSchema, profileSchema } from "../schemas/profile";

export const completeOnboardingAction = async (
  _state: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> => {
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_onboarding", {
    p_name: parsed.data.name,
    p_amount_cents: parsed.data.salary,
  });

  if (error) return { ok: false, error: mapDbError(error) };

  redirect("/");
};

export const updateNameAction = async (_state: ActionResult | null, formData: FormData): Promise<ActionResult> => {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const { userId } = await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ name: parsed.data.name }).eq("id", userId);

  return mutationResult(error);
};
