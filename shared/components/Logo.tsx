import { WalletIcon } from "lucide-react";
import Link from "next/link";

export const Logo = () => (
  <Link href="/" className="flex w-fit items-center gap-2 font-heading text-lg font-bold">
    <WalletIcon className="size-5" aria-hidden />
    Contas em Dia
  </Link>
);
