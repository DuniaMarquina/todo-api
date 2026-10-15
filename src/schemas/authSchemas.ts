import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});