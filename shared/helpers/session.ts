import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "./supabase/server";

/** DAL: valida o JWT da sessão (getClaims) e memoiza por render. Sem sessão → /login. */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) redirect("/login");

  return { userId: data.claims.sub };
});
