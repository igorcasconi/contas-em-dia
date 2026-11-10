import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";

const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("name").eq("id", userId).maybeSingle();

  // Falha de rede não pode virar "sem perfil" (mandaria quem já tem conta ao onboarding)
  if (error) throw error;
  return data;
});

/** Sessão válida + onboarding concluído; senão redireciona. */
export const requireOnboarded = cache(async () => {
  const { userId } = await verifySession();
  const profile = await getProfile(userId);

  if (!profile) redirect("/onboarding");

  return { userId, name: profile.name };
});

/** Sessão válida + onboarding pendente; quem já concluiu vai para a Início. */
export const requirePendingOnboarding = async () => {
  const { userId } = await verifySession();
  if (await getProfile(userId)) redirect("/");
};
