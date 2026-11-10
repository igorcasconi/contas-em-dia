import type { NamedRecord } from "@/shared/utils/select-options";

/** Cadastro prévio que falta para registros com tipo e banco (tipo, depois banco), ou undefined. */
export const missingCategoryOrBank = (categories: NamedRecord[], banks: NamedRecord[], subject: string) => {
  if (!categories.length) {
    return { message: `Cadastre um tipo antes de criar ${subject}.`, href: "/configuracoes/tipos", linkLabel: "Cadastrar tipo" };
  }
  if (!banks.length) {
    return { message: `Cadastre um banco antes de criar ${subject}.`, href: "/configuracoes/bancos", linkLabel: "Cadastrar banco" };
  }
};
