import "server-only";

import { cache } from "react";

import { unwrap } from "@/shared/helpers/query-result";
import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";
import { currentMonth } from "@/shared/utils/month";

import { buildPayableRows } from "./build-payable-rows";

/** Linhas do mês corrente (boletos + faturas por banco), já ordenadas por prioridade. */
export const getMonthPayables = cache(async () => {
  await verifySession();
  const supabase = await createClient();
  const month = currentMonth();

  const [bills, cardItems, cardPurchases, banks, payments] = await Promise.all([
    // Encerrado antes do mês não pode ter pagamento no mês (pay_bill exige boleto aberto)
    supabase
      .from("bills")
      .select("id, name, value_mode, amount_cents, ended_at")
      .or(`ended_at.is.null,ended_at.gte.${month}`),
    supabase
      .from("card_items")
      .select("id, name, bank_id, amount_cents, remaining_months, status")
      .is("ended_at", null),
    supabase.from("card_purchases").select("id, name, bank_id, amount_cents").eq("month", month),
    supabase.from("banks").select("id, name"),
    supabase
      .from("payments")
      .select(
        "id, kind, bill_id, bank_id, total_cents, items:payment_items(card_item_id, included, amount_cents, prev_remaining_months, prev_status, card_item:card_items(name))",
      )
      .eq("month", month),
  ]);

  return buildPayableRows({
    bills: unwrap(bills),
    cardItems: unwrap(cardItems),
    cardPurchases: unwrap(cardPurchases),
    banks: unwrap(banks),
    payments: unwrap(payments),
  });
});
