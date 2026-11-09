import { Suspense } from "react";

import { requireOnboarded } from "@/domains/profile/services/profile";
import { PageHeader } from "@/shared/components/PageHeader";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { currentMonth, formatMonth } from "@/shared/utils/month";

const Greeting = async () => {
  const { name } = await requireOnboarded();
  return <PageHeader title={`Olá, ${name}`} aside={formatMonth(currentMonth())} />;
};

export default function HomePage() {
  return (
    <Suspense fallback={<Skeleton className="h-7 w-48" />}>
      <Greeting />
    </Suspense>
  );
}
