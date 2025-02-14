import { z } from 'zod';

export const userSchema = z.object({
  id: z.number().int(),
  uid: z.string(),
});

export const createUserSchema = z.object({
  uid: z.string(),
});

export type DbUser = z.infer<typeof userSchema>;
