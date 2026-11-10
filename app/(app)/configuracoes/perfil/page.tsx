import { Suspense } from "react";

import { SignOutButton } from "@/domains/auth/components/SignOutButton";
import { ProfileForm } from "@/domains/profile/components/ProfileForm";
import { requireOnboarded } from "@/domains/profile/services/profile";
import { PageHeader } from "@/shared/components/PageHeader";
import { Skeleton } from "@/shared/components/ui/skeleton";

const ProfileContent = async () => {
  const { name } = await requireOnboarded();
  return <ProfileForm name={name} />;
};

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Perfil" />
      <Suspense fallback={<Skeleton className="h-24" />}>
        <ProfileContent />
      </Suspense>
      <SignOutButton />
    </>
  );
}
