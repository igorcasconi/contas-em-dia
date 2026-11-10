"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type UrlTabsProps = {
  /** Nome do search param que guarda a aba ativa. */
  param: string;
  tabs: { value: string; label: string; content: ReactNode }[];
};

/** Abas com a ativa refletida na URL (link direto e voltar do navegador). Primeira aba = padrão. */
export const UrlTabs = ({ param, tabs }: UrlTabsProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultValue = tabs[0].value;
  const active = tabs.some(({ value }) => value === searchParams.get(param)) ? searchParams.get(param)! : defaultValue;

  const select = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === defaultValue) params.delete(param);
    else params.set(param, value);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <Tabs value={active} onValueChange={select}>
      <TabsList className="w-full">
        {tabs.map(({ value, label }) => (
          <TabsTrigger key={value} value={value} className="flex-1">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map(({ value, content }) => (
        <TabsContent key={value} value={value} className="mt-4 flex flex-col gap-4">
          {content}
        </TabsContent>
      ))}
    </Tabs>
  );
};
