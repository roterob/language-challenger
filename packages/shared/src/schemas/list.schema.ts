import { z } from 'zod';

export const saveListSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tags: z.array(z.string()).default([]),
  resources: z.array(z.string()).min(1, 'At least one resource is required'),
});

export const listFiltersSchema = z.object({
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type SaveListInput = z.infer<typeof saveListSchema>;
export type ListFilters = z.infer<typeof listFiltersSchema>;
