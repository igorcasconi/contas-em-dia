import { WalletIcon } from "lucide-react";
import Link from "next/link";

const SIZES = {
  md: { text: "text-lg", icon: "size-5" },
  sm: { text: "text-sm", icon: "size-4" },
};

type LogoProps = {
  color?: string;
  size?: keyof typeof SIZES;
};

export const Logo = ({ color = "text-foreground", size = "md" }: LogoProps) => (
  <Link
    href="/"
    className={`flex w-fit items-center gap-2 font-heading font-bold ${SIZES[size].text} ${color}`}
  >
    <WalletIcon className={SIZES[size].icon} aria-hidden />
    Contas em Dia
  </Link>
);
