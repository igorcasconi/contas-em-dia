import { z } from "zod";

const email = z.email("Email inválido");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Informe a senha"),
});

export const signUpSchema = z
  .object({
    email,
    password: z.string().min(8, "A senha deve ter ao menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem",
  });
