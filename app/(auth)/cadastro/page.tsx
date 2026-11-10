import Link from "next/link";

import { SignUpForm } from "@/domains/auth/components/SignUpForm";

export default function SignUpPage() {
  return (
    <>
      <SignUpForm />
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
