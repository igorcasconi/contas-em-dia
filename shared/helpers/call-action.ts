import { unstable_rethrow } from "next/navigation";

import type { ActionResult } from "./action-result";

export const NETWORK_ERROR = "Não foi possível concluir. Verifique sua conexão e tente novamente.";

/**
 * Chama uma Server Action pelo client. Falha de rede (fetch rejeitado) vira resultado com erro,
 * para o modal continuar aberto com os dados; redirect/notFound do Next seguem o fluxo normal.
 */
export const callAction = async <T>(action: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> => {
  try {
    return await action();
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: NETWORK_ERROR };
  }
};
