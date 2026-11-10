import { Suspense } from "react";

import { OnboardingForm } from "@/domains/profile/components/OnboardingForm";
import { requirePendingOnboarding } from "@/domains/profile/services/profile";
import { CenteredLayout } from "@/shared/components/CenteredLayout";

const PendingOnboarding = async () => {
  await requirePendingOnboarding();
  return <OnboardingForm />;
};

export default function OnboardingPage() {
  return (
    <CenteredLayout>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Bem-vindo! 👋</h1>
        <p className="text-muted-foreground">Vamos configurar sua conta</p>
      </div>
      <Suspense>
        <PendingOnboarding />
      </Suspense>
    </CenteredLayout>
  );
}
