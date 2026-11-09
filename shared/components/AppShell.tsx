import type { ReactNode } from "react";

import { BottomNav, Sidebar } from "./AppNav";

export const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-1">
    <Sidebar />
    <main className="flex flex-1 flex-col gap-6 px-4 pt-6 pb-24 lg:px-8 lg:pb-8">{children}</main>
    <BottomNav />
  </div>
);
