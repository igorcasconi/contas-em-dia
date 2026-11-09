import "server-only";

import { refresh } from "next/cache";

import { type ActionResult, mapDbError } from "./action-result";

/** Resultado de uma escrita no banco: erro traduzido, ou refresh da página + ok. */
export const mutationResult = (error: { code?: string; message: string } | null): ActionResult => {
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, data: undefined };
};
