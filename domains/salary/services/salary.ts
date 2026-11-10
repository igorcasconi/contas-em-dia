import "server-only";

import { cache } from "react";

import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";

/** Salário vigente no mês: o último com effective_month ≤ mês. */
export const getSalaryForMonth = cache(async (month: string) => {
  await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salaries")
    .select("amount_cents")
    .lte("effective_month", month)
    .order("effective_month", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.amount_cents ?? 0;
});
