import type { ReactNode } from "react";

import { requireOnboarded } from "../services/profile";

/** Renderiza o conteúdo só para usuário com onboarding concluído. Usar dentro de <Suspense>. */
export const OnboardedGuard = async ({ children }: { children: ReactNode }) => {
  await requireOnboarded();
  return children;
};
