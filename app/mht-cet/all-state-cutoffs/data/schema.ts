import { z } from 'zod';

export const taskSchema = z.object({
  'Serial Number': z.number(),
  'ID': z.number(),
  'College': z.string(),
  'Branch': z.string(),
  'Branch_id': z.string(),
  'Status': z.string(),
  'Allocation': z.string(),
  'Category': z.string(),
  'Cutoff': z.number(),
  'City': z.string(),
  'Percentile': z.number(),
});

export type Task = z.infer<typeof taskSchema>
