import { z } from 'zod';

export const taskSchema = z.object({
  'Serial_just_for_database': z.number(),
  'Program': z.string(),
  'Pilani': z.number().optional(),
  'Goa': z.string().optional(),
  'Hyderabad': z.string().optional(),
  'OutOff': z.number(),
}); 

export type Task = z.infer<typeof taskSchema>
