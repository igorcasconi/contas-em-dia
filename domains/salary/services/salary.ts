import "server-only";

import { cache } from "react";

import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";
import { currentMonth } from "@/shared/utils/month";

/** Salário vigente no mês corrente: o último com effective_month ≤ mês. */
export const getCurrentSalary = cache(async () => {
  await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salaries")
    .select("amount_cents")
    .lte("effective_month", currentMonth())
    .order("effective_month", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.amount_cents ?? 0;
});
