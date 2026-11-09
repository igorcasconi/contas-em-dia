import { Suspense } from "react";

import { OnboardedGuard } from "@/domains/profile/components/OnboardedGuard";
import { AppShell } from "@/shared/components/AppShell";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell>
      <Suspense>
        <OnboardedGuard>{children}</OnboardedGuard>
      </Suspense>
    </AppShell>
  );
}
