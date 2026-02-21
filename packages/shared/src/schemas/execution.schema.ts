import { z } from 'zod';

export const executionConfigSchema = z.object({
  questionLang: z.enum(['en', 'es']),
  playQuestion: z.boolean().default(false),
  playAnswer: z.boolean().default(false),
  writeAnswer: z.boolean().default(false),
  automaticMode: z.boolean().default(false),
  loopMode: z.boolean().default(false),
  shuffle: z.boolean().default(false),
});

export const startExecutionSchema = z.object({
  listIds: z.array(z.string()).min(1, 'At least one list is required'),
});

export const startTemporaryExecutionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tags: z.array(z.string()).default([]),
  resourceIds: z.array(z.string()).min(1, 'At least one resource is required'),
});

export const saveResultSchema = z.object({
  currentIndex: z.number().int().min(0),
  resourceId: z.string(),
  listId: z.string().nullable().optional(),
  result: z.boolean().nullable(),
});

export const executionFiltersSchema = z.object({
  tags: z.array(z.string()).optional(),
  inProgress: z.coerce.boolean().optional(),
  automatic: z.coerce.boolean().optional(),
  from: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const resourceStatsFiltersSchema = z.object({
  tags: z.array(z.string()).optional(),
  type: z.enum(['phrase', 'vocabulary', 'paragraph']).optional(),
  favourite: z.coerce.boolean().optional(),
  result: z.enum(['passed', 'failed']).optional(),
  from: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ExecutionConfigInput = z.infer<typeof executionConfigSchema>;
export type StartExecutionInput = z.infer<typeof startExecutionSchema>;
export type StartTemporaryExecutionInput = z.infer<typeof startTemporaryExecutionSchema>;
export type SaveResultInput = z.infer<typeof saveResultSchema>;
export type ExecutionFilters = z.infer<typeof executionFiltersSchema>;
export type ResourceStatsFilters = z.infer<typeof resourceStatsFiltersSchema>;
