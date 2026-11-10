import "server-only";

import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";
import { currentMonth } from "@/shared/utils/month";

import { fillYearMonths } from "./chart-data";

/** Total pago em cada mês do ano corrente. */
export const getYearTotals = async () => {
  await verifySession();
  const month = currentMonth();
  const year = month.slice(0, 4);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("month, total_cents")
    .gte("month", `${year}-01-01`)
    .lte("month", `${year}-12-01`);

  if (error) throw error;
  return fillYearMonths(data, month);
};
