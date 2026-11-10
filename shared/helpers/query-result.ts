/** Falha explícita: lista vazia por erro de rede diria ao usuário que não há nada cadastrado/a pagar. */
export const unwrap = <T>({ data, error }: { data: T[] | null; error: unknown }) => {
  if (error) throw error;
  return data ?? [];
};
