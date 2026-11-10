"use client";

import { HouseIcon, RepeatIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/utils/cn";
import { Logo } from "./Logo";

const NAV_ITEMS = [
  { href: "/", label: "Início", Icon: HouseIcon },
  { href: "/recorrencias", label: "Recorrências", Icon: RepeatIcon },
  { href: "/configuracoes", label: "Configurações", Icon: SettingsIcon },
];

const useIsActive = () => {
  const pathname = usePathname();
  return (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
};

export const BottomNav = () => {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Menu inferior"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-primary lg:hidden"
    >
      <ul className="grid grid-cols-3">
        {NAV_ITEMS.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-xs text-white",
                isActive(href) && "text-foreground",
              )}
            >
              <div
                className={`${isActive(href) ? "bg-muted items-center text-center" : ""} flex-col p-2 items-center justify-center rounded-lg`}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export const Sidebar = () => {
  const isActive = useIsActive();

  return (
    <aside className="bg-primary hidden w-60 shrink-0 flex-col gap-6 border-r px-4 py-6 lg:flex">
      <Logo color="text-white" />
      <nav aria-label="Menu lateral">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-muted hover:text-foreground",
                  isActive(href) && "bg-muted font-medium text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
