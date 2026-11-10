/** Textos da confirmação de remoção de item do cartão (Recorrências e modal de pagamento). */
export const removeCardItemCopy = (name = "") => ({
  title: "Remover item do cartão?",
  description: `"${name}" deixará de aparecer nas próximas faturas. Pagamentos anteriores continuam no histórico.`,
  confirmLabel: "Remover",
});
