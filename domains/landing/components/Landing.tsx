import { ChartPieIcon, CreditCardIcon, ReceiptIcon } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/shared/components/Logo";
import { Button } from "@/shared/components/ui/button";

const FEATURES = [
  {
    Icon: ReceiptIcon,
    title: "Boletos fixos e variáveis",
    description: "Internet, energia, gás — com valor fixo ou informado no mês.",
  },
  {
    Icon: CreditCardIcon,
    title: "Cartões por banco",
    description: "Assinaturas e parcelas, com meses restantes.",
  },
  {
    Icon: ChartPieIcon,
    title: "Painel do mês",
    description: "Gastos por mês, por cartão e a sobra atualizada.",
  },
];

export const Landing = () => (
  <div className="theme-landing flex flex-1 flex-col bg-background text-foreground">
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <Logo />
      <Button asChild>
        <Link href="/login">Entrar</Link>
      </Button>
    </header>

    <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:gap-24">
      <section className="flex flex-col items-start gap-8">
        <h1 className="font-heading text-5xl leading-[1.05] font-bold tracking-tight lg:text-6xl">
          Quanto sobra do seu salário este mês?
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Registre boletos e pagamentos recorrentes do cartão. Veja o que já foi pago, o que falta e quanto sobra.
        </p>
        <Button asChild size="lg" className="h-10 px-8">
          <Link href="/cadastro">Começar agora</Link>
        </Button>
      </section>

      <ul className="flex flex-col gap-4">
        {FEATURES.map(({ Icon, title, description }) => (
          <li key={title} className="flex flex-col gap-2 rounded-2xl bg-card p-5">
            <Icon className="mb-2 size-5" aria-hidden />
            <h2 className="font-heading font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </li>
        ))}
      </ul>
    </main>
  </div>
);
