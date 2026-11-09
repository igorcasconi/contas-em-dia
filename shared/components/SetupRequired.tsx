import Link from "next/link";

import { Button } from "./ui/button";

/** Aviso de cadastro prévio obrigatório (ex: tipo antes de boleto), com link para resolver. */
export const SetupRequired = ({ message, href, linkLabel }: { message: string; href: string; linkLabel: string }) => (
  <div role="status" className="flex flex-col items-start gap-3 rounded-lg bg-muted p-4 text-sm">
    <p>{message}</p>
    <Button asChild variant="outline" size="sm">
      <Link href={href}>{linkLabel}</Link>
    </Button>
  </div>
);
