import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import type { Database } from "@/shared/types/database";

import { supabaseKey, supabaseUrl } from "./env";

/** Client por request — nunca reutilizar entre requests. */
export const createClient = async () => {
  // Dados por usuário: só em request time. Evita o supabase-js chamar Date.now() no prerender (runtime prefetch).
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components não podem gravar cookies; o proxy renova a sessão.
        }
      },
    },
  });
};
