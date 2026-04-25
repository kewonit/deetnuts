import { z } from "zod";

import {
  QUESTION_STATUSES,
  SOURCE_TYPES,
  SUBJECTS,
  type MhtCetQuestionStatus,
  type MhtCetSourceType,
  type MhtCetSubject,
} from "../schema";

const ExamGroupSchema = z.enum(["pcm", "pcb"]);

export const ParagraphBlockSchema = z
  .object({
    type: z.literal("paragraph"),
    text: z.string(),
    inlineMath: z.array(z.string()).optional(),
  })
  .strict();

export const MathBlockSchema = z
  .object({
    type: z.literal("math"),
    tex: z.string(),
    display: z.boolean().optional(),
  })
  .strict();

export const ImageBlockSchema = z
  .object({
    type: z.literal("image"),
    src: z.string(),
    alt: z.string(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  })
  .strict();

export const TableBlockSchema = z
  .object({
    type: z.literal("table"),
    rows: z.array(z.array(z.string())).min(1),
    caption: z.string().optional(),
  })
  .strict();

export const ListBlockSchema = z
  .object({
    type: z.literal("list"),
    ordered: z.boolean().optional(),
    items: z.array(z.string()).min(1),
  })
  .strict();

export const QuestionBlockSchema = z.discriminatedUnion("type", [
  ParagraphBlockSchema,
  MathBlockSchema,
  ImageBlockSchema,
  TableBlockSchema,
  ListBlockSchema,
]);

export const QuestionOptionSchema = z
  .object({
    id: z.string(),
    body: z.array(QuestionBlockSchema).min(1),
  })
  .strict();

export const QuestionSourceSchema = z
  .object({
    title: z.string(),
    sourceType: z.enum(SOURCE_TYPES),
    sourceUrl: z.string().url().optional(),
    fileName: z.string().optional(),
    fileSha256: z.string().optional(),
    licenseNote: z.string(),
    year: z.number().int().min(2000).max(2100).optional(),
    examGroup: ExamGroupSchema.optional(),
  })
  .strict();

export const QuestionImportRowSchema = z
  .object({
    source: QuestionSourceSchema,
    subject: z.enum(SUBJECTS),
    chapterSlug: z.string().optional(),
    year: z.number().int().min(2000).max(2100).optional(),
    examGroup: ExamGroupSchema.optional(),
    difficulty: z.enum(["unknown", "easy", "medium", "hard"]).optional(),
    marks: z.number().positive().optional(),
    negativeMarks: z.number().min(0).optional(),
    questionType: z.literal("single_correct"),
    body: z.array(QuestionBlockSchema).min(1),
    options: z.array(QuestionOptionSchema).min(2),
    correctOptionIds: z.array(z.string()).min(1),
    explanation: z.array(QuestionBlockSchema).optional(),
    verificationStatus: z.enum(QUESTION_STATUSES).optional(),
  })
  .strict();

export type QuestionBlock = z.infer<typeof QuestionBlockSchema>;
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;
export type QuestionSource = z.infer<typeof QuestionSourceSchema> & {
  sourceType: MhtCetSourceType;
};
export type QuestionImportRow = z.infer<typeof QuestionImportRowSchema> & {
  source: QuestionSource;
  subject: MhtCetSubject;
  verificationStatus?: MhtCetQuestionStatus;
};
