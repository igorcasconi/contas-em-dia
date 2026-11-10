import Link from "next/link";

import { Button } from "./ui/button";
import { DialogClose } from "./ui/dialog";

/**
 * Aviso de cadastro prévio obrigatório (ex: tipo antes de boleto), com link para resolver.
 * Usado dentro de modais: o link fecha o modal antes de navegar — com cacheComponents a rota
 * anterior fica montada (Activity) e o modal continuaria aberto.
 */
export const SetupRequired = ({ message, href, linkLabel }: { message: string; href: string; linkLabel: string }) => (
  <div role="status" className="flex flex-col items-start gap-3 rounded-lg bg-muted p-4 text-sm">
    <p>{message}</p>
    <DialogClose asChild>
      <Button asChild variant="outline" size="sm">
        <Link href={href}>{linkLabel}</Link>
      </Button>
    </DialogClose>
  </div>
);
