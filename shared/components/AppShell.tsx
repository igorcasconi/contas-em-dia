import type { ReactNode } from "react";

import { BottomNav, Sidebar } from "./AppNav";
import { Logo } from "./Logo";

export const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-1">
    <Sidebar />
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Mobile: marca fixa no topo (desktop tem a sidebar) */}
      <header className="sticky top-0 z-40 flex h-8 items-center justify-center bg-primary lg:hidden">
        <Logo color="text-white" size="sm" />
      </header>
      <main className="flex flex-1 flex-col gap-6 px-4 pt-6 pb-24 lg:px-8 lg:pb-8">{children}</main>
    </div>
    <BottomNav />
  </div>
);
