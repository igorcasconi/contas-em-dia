import type { ReactNode } from "react";

export const EmptyState = ({ message, action }: { message: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center">
    <p className="text-sm text-muted-foreground">{message}</p>
    {action}
  </div>
);
