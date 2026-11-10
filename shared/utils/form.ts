import { type FormEvent, startTransition } from "react";

/**
 * Submete o form para uma action sem o reset automático do React 19,
 * preservando o que o usuário digitou quando a action retorna erro.
 */
export const submitWithoutReset = (action: (formData: FormData) => void) => (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  startTransition(() => action(formData));
};
