"use server";

import { redirect } from "next/navigation";

import { type ActionResult, fromZodError } from "@/shared/helpers/action-result";
import { createClient } from "@/shared/helpers/supabase/server";

import { signInSchema, signUpSchema } from "../schemas/auth";

const DUPLICATED_EMAIL_CODES = new Set(["user_already_exists", "email_exists"]);

export const signUpAction = async (_state: ActionResult | null, formData: FormData): Promise<ActionResult> => {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password });

  if (error) {
    const duplicated = DUPLICATED_EMAIL_CODES.has(error.code ?? "");
    return { ok: false, error: duplicated ? "Email já cadastrado" : "Não foi possível criar a conta. Tente novamente." };
  }

  redirect("/onboarding");
};

export const signInAction = async (_state: ActionResult | null, formData: FormData): Promise<ActionResult> => {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { ok: false, error: "Email ou senha inválidos" };

  redirect("/");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
};
