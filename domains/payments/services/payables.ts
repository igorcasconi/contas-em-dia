import "server-only";

import { cache } from "react";

import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";
import { currentMonth } from "@/shared/utils/month";

import { buildPayableRows } from "./build-payable-rows";

/** Falha explícita: lista vazia por erro de rede diria ao usuário que não há nada a pagar. */
const unwrap = <T>({ data, error }: { data: T | null; error: unknown }) => {
  if (error) throw error;
  return data ?? ([] as T);
};

/** Linhas do mês corrente (boletos + faturas por banco), já ordenadas por prioridade. */
export const getMonthPayables = cache(async () => {
  await verifySession();
  const supabase = await createClient();

  const [bills, cardItems, banks, payments] = await Promise.all([
    supabase.from("bills").select("id, name, value_mode, amount_cents, ended_at"),
    supabase
      .from("card_items")
      .select("id, name, bank_id, amount_cents, remaining_months, status")
      .is("ended_at", null),
    supabase.from("banks").select("id, name"),
    supabase
      .from("payments")
      .select(
        "id, kind, bill_id, bank_id, total_cents, items:payment_items(card_item_id, included, amount_cents, prev_remaining_months, prev_status, card_item:card_items(name))",
      )
      .eq("month", currentMonth()),
  ]);

  return buildPayableRows({
    bills: unwrap(bills),
    cardItems: unwrap(cardItems),
    banks: unwrap(banks),
    payments: unwrap(payments),
  });
});
