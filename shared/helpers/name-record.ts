import { z } from "zod";

/** Registros que têm só nome (Tipos, Bancos). */
export const nameRecordSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(100, "Use no máximo 100 caracteres"),
});

export const nameRecordUpdateSchema = nameRecordSchema.extend({ id: z.uuid() });
