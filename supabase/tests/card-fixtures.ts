import type { TestUser } from "./helpers";

type ItemSeed = { name: string; amount_cents: number; remaining_months?: number; status?: string };

/** Cria tipo + banco com itens; retorna ids por nome do item. */
export const seedBankWithItems = async ({ client }: TestUser, bankName: string, items: ItemSeed[]) => {
  const { data: category } = await client.from("categories").insert({ name: `Tipo ${bankName}` }).select("id").single();
  const { data: bank } = await client.from("banks").insert({ name: bankName }).select("id").single();
  const { data: rows, error } = await client
    .from("card_items")
    // Insert em lote: chave ausente em algum objeto vira null (não default) — status explícito
    .insert(items.map((item) => ({ status: "active", ...item, bank_id: bank!.id, category_id: category!.id })))
    .select("id, name");
  if (error) throw error;

  return { bankId: bank!.id, ids: Object.fromEntries(rows.map(({ name, id }) => [name, id])) };
};

export type CardSelection = { card_item_id: string; included: boolean; pause?: boolean };
