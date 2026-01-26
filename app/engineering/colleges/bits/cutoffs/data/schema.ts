import { z } from "zod";

export const taskSchema = z.object({
  id: z.string(),
  collectionId: z.string(),
  collectionName: z.string(),
  created: z.string(),
  updated: z.string(),
  Program: z.string(),
  Pilani: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((val) =>
      typeof val === "string" ? val : val?.toString() || "",
    ),
  Goa: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((val) =>
      typeof val === "string" ? val : val?.toString() || "",
    ),
  Hyderabad: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((val) =>
      typeof val === "string" ? val : val?.toString() || "",
    ),
  OutOff: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? val : val.toString())),
  Year: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? val : val.toString())),
});

export type Task = z.infer<typeof taskSchema>;
