import "server-only";

import { unwrap } from "@/shared/helpers/query-result";
import { verifySession } from "@/shared/helpers/session";
import { createClient } from "@/shared/helpers/supabase/server";

const listActiveCardItems = async () => {
  await verifySession();
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("card_items")
      .select("id, name, amount_cents, remaining_months, status, category:categories(id, name), bank:banks(id, name)")
      .is("ended_at", null)
      .order("name"),
  );
};

export type ActiveCardItem = Awaited<ReturnType<typeof listActiveCardItems>>[number];

/** Itens não encerrados, agrupados por banco (bancos em ordem alfabética). */
export const listCardItemsByBank = async () => {
  const groups = Map.groupBy(await listActiveCardItems(), (item) => item.bank.id);

  return [...groups.values()]
    .map((items) => ({ bank: items[0].bank, items }))
    .sort((a, b) => a.bank.name.localeCompare(b.bank.name, "pt-BR"));
};

export type CardItemGroup = Awaited<ReturnType<typeof listCardItemsByBank>>[number];
