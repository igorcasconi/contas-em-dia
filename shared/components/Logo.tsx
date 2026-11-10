import { WalletIcon } from "lucide-react";
import Link from "next/link";

type LogoProps = {
  color?: string;
};

export const Logo = ({ color = "text-foreground" }: LogoProps) => (
  <Link
    href="/"
    className={`flex w-fit items-center gap-2 font-heading text-lg font-bold ${color}`}
  >
    <WalletIcon className="size-5" aria-hidden />
    Contas em Dia
  </Link>
);
