import { requireOnboarded } from "@/domains/profile/services/profile";
import { PageHeader } from "@/shared/components/PageHeader";
import { currentMonth, formatMonth } from "@/shared/utils/month";

export default async function HomePage() {
  const { name } = await requireOnboarded();

  return <PageHeader title={`Olá, ${name}`} aside={formatMonth(currentMonth())} />;
}
