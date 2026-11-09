import { Suspense } from "react";

import { OnboardingForm } from "@/domains/profile/components/OnboardingForm";
import { requirePendingOnboarding } from "@/domains/profile/services/profile";

const PendingOnboarding = async () => {
  await requirePendingOnboarding();
  return <OnboardingForm />;
};

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Bem-vindo! 👋</h1>
          <p className="text-muted-foreground">Vamos configurar sua conta</p>
        </div>
        <Suspense>
          <PendingOnboarding />
        </Suspense>
      </div>
    </main>
  );
}
