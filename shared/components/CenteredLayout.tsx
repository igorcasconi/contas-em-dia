import type { ReactNode } from "react";

/** Coluna estreita centralizada (telas fora do app: login, cadastro, onboarding). */
export const CenteredLayout = ({ children }: { children: ReactNode }) => (
  <main className="flex flex-1 items-center justify-center px-4 py-12">
    <div className="flex w-full max-w-sm flex-col gap-8">{children}</div>
  </main>
);
