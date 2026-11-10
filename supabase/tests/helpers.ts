import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/types/database";
import { currentMonth } from "@/shared/utils/month";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

/** Client com secret key (ignora RLS) — só para preparar cenários nos testes. */
export const admin = createClient<Database>(url, secretKey, clientOptions);

/** Cria usuário confirmado e retorna um client autenticado como ele. */
export const createTestUser = async () => {
  const email = `test-${crypto.randomUUID()}@example.com`;
  const password = "password-123";

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;

  const client = createClient<Database>(url, publishableKey, clientOptions);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  return {
    client,
    email,
    password,
    userId: data.user.id,
    remove: () => admin.auth.admin.deleteUser(data.user.id),
  };
};

export type TestUser = Awaited<ReturnType<typeof createTestUser>>;

/** Falha explícita no seed: erro aparece na origem, não numa asserção posterior. */
export const must = <T>({ data, error }: { data: T; error: unknown }) => {
  if (error || data === null) throw error ?? new Error("Seed sem dados");
  return data as NonNullable<T>;
};

/** Primeiro dia do mês anterior ao corrente (fuso de São Paulo). */
export const previousMonth = () => {
  const [year, month] = currentMonth().split("-").map(Number);
  return new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10);
};
