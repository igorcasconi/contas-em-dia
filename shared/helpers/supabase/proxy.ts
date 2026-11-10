import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "@/shared/types/database";

import { isSessionExpired } from "../session-expiry";
import { supabaseKey, supabaseUrl } from "./env";

const LANDING_ROUTE = "/inicio";
const GUEST_ONLY_ROUTES = ["/login", "/cadastro", LANDING_ROUTE];

/**
 * Renova os tokens da sessão, aplica o limite de 30 dias e faz os redirects otimistas.
 * Autorização real fica no DAL (verifySession).
 */
export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Não inserir código entre createServerClient e getClaims: pode deslogar usuários aleatoriamente.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  // Redirect/rewrite carregam os cookies já atualizados (refresh ou signOut)
  const withCookies = (target: NextResponse) => {
    response.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
    return target;
  };
  const redirectTo = (to: string) => withCookies(NextResponse.redirect(new URL(to, request.url)));

  const { pathname } = request.nextUrl;
  const isGuestOnlyRoute = GUEST_ONLY_ROUTES.includes(pathname);

  if (claims && isSessionExpired(claims.amr)) {
    await supabase.auth.signOut();
    return redirectTo("/login");
  }

  // Anônimo em / vê a landing sem mudar a URL
  if (!claims && pathname === "/") return withCookies(NextResponse.rewrite(new URL(LANDING_ROUTE, request.url)));
  if (!claims && !isGuestOnlyRoute) return redirectTo("/login");
  if (claims && isGuestOnlyRoute) return redirectTo("/");

  return response;
};
