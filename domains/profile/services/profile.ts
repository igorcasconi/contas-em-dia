import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";

export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("name").eq("id", userId).maybeSingle();
  return data;
});

/** Sessão válida + onboarding concluído; senão redireciona. */
export const requireOnboarded = cache(async () => {
  const { userId } = await verifySession();
  const profile = await getProfile(userId);

  if (!profile) redirect("/onboarding");

  return { userId, name: profile.name };
});
