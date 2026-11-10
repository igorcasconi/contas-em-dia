import "server-only";

import { unwrap } from "@/shared/helpers/query-result";
import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";
import { currentMonth } from "@/shared/utils/month";

const listMonthPurchases = async () => {
  await verifySession();
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("card_purchases")
      .select("id, name, amount_cents, category:categories(id, name), bank:banks(id, name)")
      .eq("month", currentMonth())
      .order("name"),
  );
};

export type CardPurchase = Awaited<ReturnType<typeof listMonthPurchases>>[number];

/** Avulsos do mês atual, agrupados por banco (bancos e itens em ordem alfabética). */
export const listMonthPurchasesByBank = async () => {
  const groups = Map.groupBy(await listMonthPurchases(), (purchase) => purchase.bank.id);

  return [...groups.values()]
    .map((items) => ({
      bank: items[0].bank,
      items,
      subtotalCents: items.reduce((sum, item) => sum + item.amount_cents, 0),
    }))
    .sort((a, b) => a.bank.name.localeCompare(b.bank.name, "pt-BR"));
};

export type CardPurchaseGroup = Awaited<ReturnType<typeof listMonthPurchasesByBank>>[number];
