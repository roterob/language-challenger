import { z } from 'zod';

export const resourceTypeEnum = z.enum(['phrase', 'vocabulary', 'paragraph']);

export const saveResourceSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  type: resourceTypeEnum,
  tags: z.array(z.string()).default([]),
  contentEs: z.string().nullable().default(null),
  contentEsAudio: z.string().nullable().default(null),
  contentEn: z.string().nullable().default(null),
  contentEnAudio: z.string().nullable().default(null),
});

export const resourceFiltersSchema = z.object({
  tags: z.array(z.string()).optional(),
  type: resourceTypeEnum.optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type SaveResourceInput = z.infer<typeof saveResourceSchema>;
export type ResourceFilters = z.infer<typeof resourceFiltersSchema>;
