import { z } from "zod";

const difficultySchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") {
      return 1;
    }
    return value;
  },
  z.coerce.number().int().min(1).max(5),
);

export const ImportVariantSchema = z.object({
  type: z.string().trim().min(1, "variant.type 不能为空"),
  text: z.string().trim().min(1, "variant.text 不能为空"),
  note: z.string().trim().optional(),
});

export const ImportSegmentSchema = z.object({
  order: z.number().int().min(0),
  segmentType: z.enum(["paragraph", "line", "qa"]).default("paragraph"),
  speaker: z.string().trim().optional(),
  zh: z.string().trim().min(1, "segment.zh 不能为空"),
  en: z.string().trim().min(1, "segment.en 不能为空"),
  note: z.string().trim().optional(),
});

export const ImportMaterialSchema = z.object({
  title: z.string().trim().min(1, "title 不能为空"),
  contentType: z
    .enum(["sentence", "monologue", "dialogue", "article", "interview", "ielts"])
    .default("sentence"),
  zh: z.string().trim().default(""),
  en: z.string().trim().default(""),
  scene: z.string().trim().optional(),
  level: z.string().trim().optional(),
  usage: z.string().trim().optional(),
  note: z.string().trim().optional(),
  difficulty: difficultySchema.default(1),
  variants: z.array(ImportVariantSchema).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
  segments: z.array(ImportSegmentSchema).default([]),
});

export const ImportBatchSchema = z.object({
  batchTitle: z.string().trim().optional(),
  source: z.string().trim().optional(),
  materials: z
    .array(ImportMaterialSchema)
    .min(1, "materials 必须至少包含 1 条语料"),
});

export type ImportBatchInput = z.infer<typeof ImportBatchSchema>;
export type ImportMaterialInput = z.infer<typeof ImportMaterialSchema>;
export type ImportVariantInput = z.infer<typeof ImportVariantSchema>;

export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `${path}: ${issue.message}`;
  });
}
