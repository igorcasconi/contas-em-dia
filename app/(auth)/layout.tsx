import { CenteredLayout } from "@/shared/components/CenteredLayout";
import { Logo } from "@/shared/components/Logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <CenteredLayout>
      <h1 className="sr-only">Contas em Dia</h1>
      <div className="flex justify-center">
        <Logo />
      </div>
      <div className="flex flex-col gap-6 rounded-2xl border bg-card p-6">{children}</div>
    </CenteredLayout>
  );
}
