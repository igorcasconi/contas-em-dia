import { PlusIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/shared/components/ui/button";

/** Botão "+" flutuante, acima da bottom nav no mobile. Exige `aria-label`. */
export const Fab = (
  props: ComponentProps<typeof Button> & { "aria-label": string },
) => (
  <Button
    size="icon-lg"
    className="fixed right-4 bottom-20 z-30 size-14 rounded-full shadow-lg lg:right-8 lg:bottom-8"
    {...props}
  >
    <PlusIcon className="size-6" aria-hidden />
  </Button>
);
