import "server-only";

import { unwrap } from "@/shared/helpers/query-result";
import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";
import { currentMonth } from "@/shared/utils/month";

const listMonthData = async () => {
  await verifySession();
  const supabase = await createClient();
  const month = currentMonth();
  const [purchases, payments] = await Promise.all([
    supabase
      .from("card_purchases")
      .select("id, name, amount_cents, category:categories(id, name), bank:banks(id, name)")
      .eq("month", month)
      .order("name"),
    supabase.from("payments").select("bank_id").eq("kind", "card").eq("month", month),
  ]);
  return { purchases: unwrap(purchases), payments: unwrap(payments) };
};

export type CardPurchase = Awaited<ReturnType<typeof listMonthData>>["purchases"][number];

/** Avulsos do mês atual, agrupados por banco (bancos e itens em ordem alfabética), com status da fatura. */
export const listMonthPurchasesByBank = async () => {
  const { purchases, payments } = await listMonthData();
  const paidBankIds = new Set(payments.map((payment) => payment.bank_id));
  const groups = Map.groupBy(purchases, (purchase) => purchase.bank.id);

  return [...groups.values()]
    .map((items) => ({
      bank: items[0].bank,
      items,
      subtotalCents: items.reduce((sum, item) => sum + item.amount_cents, 0),
      invoicePaid: paidBankIds.has(items[0].bank.id),
    }))
    .sort((a, b) => a.bank.name.localeCompare(b.bank.name, "pt-BR"));
};

export type CardPurchaseGroup = Awaited<ReturnType<typeof listMonthPurchasesByBank>>[number];
