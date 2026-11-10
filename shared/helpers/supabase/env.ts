const requireEnv = (name: string, value: string | undefined) => {
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
};

// Acesso literal a process.env para o Next inlinar as variáveis NEXT_PUBLIC_*
export const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseKey = requireEnv(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
