import "server-only";

import { unwrap } from "@/shared/helpers/query-result";
import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";

export const listActiveBills = async () => {
  await verifySession();
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("bills")
      .select("id, name, value_mode, amount_cents, category:categories(id, name)")
      .is("ended_at", null)
      .order("name"),
  );
};

export type ActiveBill = Awaited<ReturnType<typeof listActiveBills>>[number];
