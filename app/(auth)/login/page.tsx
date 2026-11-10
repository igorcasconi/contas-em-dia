import Link from "next/link";

import { SignInForm } from "@/domains/auth/components/SignInForm";

export default function LoginPage() {
  return (
    <>
      <SignInForm />
      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-foreground underline-offset-4 hover:underline">
          Cadastre-se
        </Link>
      </p>
    </>
  );
}
