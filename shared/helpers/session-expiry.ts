const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

type AmrClaim = ReadonlyArray<{ timestamp: number } | string> | undefined;

/**
 * Limite de 30 dias desde o login. Usa o claim `amr` (momento da autenticação),
 * que se mantém nos refreshes — diferente de `iat`, renovado a cada token.
 */
export const isSessionExpired = (amr: AmrClaim, now = new Date()) => {
  const timestamps = (amr ?? []).flatMap((entry) => (typeof entry === "string" ? [] : [entry.timestamp]));
  if (!timestamps.length) return true;

  return now.getTime() / 1000 - Math.min(...timestamps) > SESSION_MAX_AGE_SECONDS;
};
