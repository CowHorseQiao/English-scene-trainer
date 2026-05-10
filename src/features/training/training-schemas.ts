import { z } from "zod";

// -- Cloze exercise generation --

export const ClozeBlankSchema = z.object({
  index: z.number().int().min(1),
  answer: z.string().min(1),
  type: z.enum(["keyword", "collocation", "grammar", "phrase"]),
  hint: z.string().optional(),
  explanation: z.string().min(1),
});

export const ClozeSegmentSchema = z.object({
  segmentIndex: z.number().int().min(0),
  enWithBlanks: z.string().min(1),
  blanks: z.array(ClozeBlankSchema).min(1),
});

export const AIGeneratedClozeSchema = z.object({
  segments: z.array(ClozeSegmentSchema).min(1),
});

export type ClozeBlank = z.infer<typeof ClozeBlankSchema>;
export type ClozeSegment = z.infer<typeof ClozeSegmentSchema>;
export type AIGeneratedCloze = z.infer<typeof AIGeneratedClozeSchema>;

// -- Zh-to-En scoring --

export const SegmentScoreSchema = z.object({
  segmentIndex: z.number().int().min(0),
  score: z.number().int().min(0).max(100),
  semanticAccuracy: z.number().int().min(0).max(100),
  grammar: z.number().int().min(0).max(100),
  naturalness: z.number().int().min(0).max(100),
  feedbackZh: z.string().min(1),
  correctedVersion: z.string().min(1),
  keyIssues: z.array(z.string()),
});

export const AIScoredResultSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  summaryZh: z.string().min(1),
  priorityImprovements: z.array(z.string()),
  segments: z.array(SegmentScoreSchema).min(1),
});

export type SegmentScore = z.infer<typeof SegmentScoreSchema>;
export type AIScoredResult = z.infer<typeof AIScoredResultSchema>;

// -- Error formatting --

export function formatClozeZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}
