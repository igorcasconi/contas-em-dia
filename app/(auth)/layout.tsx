import { CenteredLayout } from "@/shared/components/CenteredLayout";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <CenteredLayout>
      <h1 className="text-center text-2xl font-semibold">Contas em Dia</h1>
      {children}
    </CenteredLayout>
  );
}
