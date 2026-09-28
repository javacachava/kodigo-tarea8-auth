import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Ingresa tu correo electrónico.")
  .email("Ingresa un correo electrónico válido.")
  .max(254, "El correo es demasiado largo.")
  .transform((value) => value.toLowerCase());

export const password = z
  .string()
  .min(12, "La contraseña debe tener al menos 12 caracteres.")
  .max(128, "La contraseña no puede superar 128 caracteres.")
  .regex(/[a-z]/, "Incluye al menos una letra minúscula.")
  .regex(/[A-Z]/, "Incluye al menos una letra mayúscula.")
  .regex(/[0-9]/, "Incluye al menos un número.");

const displayName = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres.")
  .max(80, "El nombre no puede superar 80 caracteres.")
  .regex(/^[\p{L}\p{M}' .-]+$/u, "Usa solo letras y caracteres habituales de un nombre.");

export const signInSchema = z.object({ email, password: z.string().min(1, "Ingresa tu contraseña.") });

export const signUpSchema = z
  .object({
    displayName,
    email,
    password,
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type ActionFieldErrors = Record<string, string[] | undefined>;

export function fieldErrors(error: z.ZodError): ActionFieldErrors {
  return error.flatten().fieldErrors;
}
