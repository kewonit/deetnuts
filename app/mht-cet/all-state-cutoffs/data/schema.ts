import { z } from "zod"

// Define the schema for MHTCET state cutoffs (2024 structure)
export const taskSchema = z.object({
  "id": z.string(),
  "college_code": z.string(),
  "college_name": z.string(),
  "course_code": z.string(),
  "course_name": z.string(),
  "category": z.string(),
  "seat_allocation_section": z.string(),
  "cutoff_score": z.string().or(z.number()).transform(String),
  "last_rank": z.string().or(z.number()).transform(String),
  "total_admitted": z.number(),
  "created": z.string(),
  "updated": z.string(),
})

export type Task = z.infer<typeof taskSchema>
