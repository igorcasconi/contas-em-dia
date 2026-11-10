import { z } from "zod";

import type { ActionResult } from "./action-result";

/** Ids recebidos do client por Server Actions (endpoint público): valida antes de tocar no banco. */
export const isRecordId = (id: unknown): id is string => z.uuid().safeParse(id).success;

export const INVALID_RECORD: ActionResult<never> = { ok: false, error: "Registro inválido." };
