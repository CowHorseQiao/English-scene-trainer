import { z } from "zod";

const contentTypeSchema = z.enum(["sentence", "monologue", "dialogue", "article", "interview", "ielts"]);
const speakerSchema = z.enum(["Tim", "Dacey", "Stokie", "Tina"]);

export const DailyMaterialSegmentSchema = z.object({
  order: z.number().int().min(0),
  segmentType: z.enum(["paragraph", "line", "qa"]).default("paragraph"),
  speaker: speakerSchema.optional(),
  zh: z.string().trim().min(1),
  en: z.string().trim().min(1),
  note: z.string().trim().optional(),
});

export const DailyMaterialVariantSchema = z.object({
  type: z.string().trim().min(1),
  text: z.string().trim().min(1),
  note: z.string().trim().optional(),
});

export const DailyMaterialDraftContentSchema = z.object({
  title: z.string().trim().min(1).max(120),
  contentType: contentTypeSchema,
  categoryPath: z.array(z.string().trim().min(1)).min(1),
  zh: z.string().trim().default(""),
  en: z.string().trim().default(""),
  scene: z.string().trim().optional(),
  level: z.string().trim().optional(),
  usage: z.string().trim().optional(),
  note: z.string().trim().optional(),
  difficulty: z.coerce.number().int().min(1).max(5).default(3),
  tags: z.array(z.string().trim().min(1).max(30)).default([]),
  variants: z.array(DailyMaterialVariantSchema).default([]),
  segments: z.array(DailyMaterialSegmentSchema).default([]),
}).superRefine((value, ctx) => {
  if (value.contentType === "sentence") {
    if (!value.zh) {
      ctx.addIssue({ code: "custom", path: ["zh"], message: "sentence 类型需要中文内容" });
    }
    if (!value.en) {
      ctx.addIssue({ code: "custom", path: ["en"], message: "sentence 类型需要英文内容" });
    }
  } else if (value.segments.length === 0) {
    ctx.addIssue({ code: "custom", path: ["segments"], message: "非 sentence 类型至少需要一个段落" });
  }

  if ((value.contentType === "dialogue" || value.contentType === "interview") && value.segments.some((seg) => !seg.speaker)) {
    ctx.addIssue({ code: "custom", path: ["segments"], message: "dialogue / interview 类型每段需要 speaker" });
  }
});

export const DailyGenerationPlanSchema = z.object({
  contentType: contentTypeSchema,
  topic: z.string().trim().min(1),
  categoryPath: z.array(z.string().trim().min(1)).min(1),
  reason: z.string().trim().min(1),
});

export const DailyGenerationOutputSchema = z.object({
  strategySummary: z.string().trim().min(1),
  plans: z.array(DailyGenerationPlanSchema).min(1),
  materials: z.array(DailyMaterialDraftContentSchema).min(1).max(10),
});

export const DailyGenerationSettingFormSchema = z.object({
  enabled: z.boolean(),
  generateTime: z.string().trim().max(20).optional(),
  totalCount: z.coerce.number().int().min(1).max(10),
  dialogueCount: z.coerce.number().int().min(0).max(10),
  monologueCount: z.coerce.number().int().min(0).max(10),
  interviewCount: z.coerce.number().int().min(0).max(10),
  articleCount: z.coerce.number().int().min(0).max(10),
  ieltsCount: z.coerce.number().int().min(0).max(10),
  allowSuggestCategory: z.boolean(),
  autoImport: z.boolean(),
  maxPendingDrafts: z.coerce.number().int().min(1).max(100),
  learningGoal: z.string().trim().max(1000).optional(),
  focusNote: z.string().trim().max(1000).optional(),
});

export type DailyMaterialDraftContent = z.infer<typeof DailyMaterialDraftContentSchema>;
export type DailyGenerationOutput = z.infer<typeof DailyGenerationOutputSchema>;
export type DailyGenerationSettingFormInput = z.infer<typeof DailyGenerationSettingFormSchema>;

export function formatDailyZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.length ? issue.path.join(".") : "root"}: ${issue.message}`)
    .join("; ");
}
