export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

type DbError = { code?: string; message: string };

const DB_ERROR_MESSAGES: Record<string, string> = {
  "23505": "Já existe um registro com esse nome.",
  "23503": "Este registro está em uso e não pode ser excluído.",
};

const GENERIC_ERROR = "Algo deu errado. Tente novamente.";

/** Traduz erros do Postgres/PostgREST; `P0001` (raise nas RPCs) já vem com mensagem para o usuário. */
export const mapDbError = ({ code = "", message }: DbError) => {
  if (code === "P0001") return message;
  return DB_ERROR_MESSAGES[code] ?? GENERIC_ERROR;
};
