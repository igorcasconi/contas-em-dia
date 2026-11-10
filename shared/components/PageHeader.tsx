import type { ReactNode } from "react";

export const PageHeader = ({ title, aside }: { title: string; aside?: ReactNode }) => (
  <header className="flex items-baseline justify-between gap-4">
    <h1 className="text-xl font-semibold">{title}</h1>
    {aside && <span className="text-sm text-muted-foreground">{aside}</span>}
  </header>
);
