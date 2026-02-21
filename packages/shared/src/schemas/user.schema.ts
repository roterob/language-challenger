import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const updateUISettingsSchema = z.object({
  uiSettings: z.record(z.unknown()),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUISettingsInput = z.infer<typeof updateUISettingsSchema>;
