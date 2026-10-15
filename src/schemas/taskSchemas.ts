import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(200),
  description: z.string().trim().max(1000).optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });