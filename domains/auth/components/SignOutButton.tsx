import { LogOutIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

import { signOutAction } from "../actions/auth";

export const SignOutButton = () => (
  <form action={signOutAction}>
    <Button type="submit" variant="outline">
      <LogOutIcon aria-hidden />
      Sair
    </Button>
  </form>
);
