import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/shared/components/PageHeader";

const SETTINGS_LINKS = [
  { href: "/configuracoes/tipos", label: "Tipos" },
  { href: "/configuracoes/bancos", label: "Bancos" },
  { href: "/configuracoes/perfil", label: "Perfil" },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Configurações" />
      <ul className="divide-y rounded-xl border">
        {SETTINGS_LINKS.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className="flex items-center justify-between px-4 py-3 hover:bg-muted">
              {label}
              <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
