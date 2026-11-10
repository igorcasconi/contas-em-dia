import type { ReactNode } from "react";

type PageHeaderProps = { title: string; aside?: ReactNode; action?: ReactNode };

/** Título + texto à direita; no mobile a `action` ocupa uma linha própria em largura total. */
export const PageHeader = ({ title, aside, action }: PageHeaderProps) => (
  <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
    <h1 className="min-w-0 flex-1 truncate font-heading text-xl font-semibold">{title}</h1>
    {aside && <span className="text-sm text-muted-foreground">{aside}</span>}
    {action && <div className="w-full lg:w-auto">{action}</div>}
  </header>
);
