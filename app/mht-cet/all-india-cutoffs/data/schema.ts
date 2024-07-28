import { z } from 'zod';

export const taskSchema = z.object({
  'Serial Number': z.string(),
  'All India Merit': z.number().optional(),
  Percentile: z.number(),
  'Choice Code': z.string(),
  'Institute Code': z.number(),
  'Institute Name': z.string(),
  'Course Name': z.string(),
  'Exam(JEE/MHT-CET)': z.string(),
  'Type': z.string(),
  'Seat Type': z.string(),
});

export type Task = z.infer<typeof taskSchema>
