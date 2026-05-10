import { z } from "zod";

const AISegmentSchema = z.object({
  order: z.number().int().min(0),
  segmentType: z.enum(["paragraph", "line", "qa"]),
  speaker: z.enum(["Tim", "Dacey", "Stokie", "Tina"]).optional(),
  en: z.string().min(1, "英文内容不能为空"),
  zh: z.string().min(1, "中文内容不能为空"),
  note: z.string().optional(),
});

export const AIGeneratedSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(120, "标题不能超过120字符"),
  contentType: z.enum(["monologue", "dialogue", "article", "interview", "ielts"]),
  scene: z.string().optional(),
  level: z.string().optional(),
  usage: z.string().optional(),
  note: z.string().optional(),
  difficulty: z.number().int().min(1).max(5),
  tags: z.array(z.string().max(30)),
  segments: z.array(AISegmentSchema).min(1, "至少需要一个段落"),
});

export type AIGeneratedOutput = z.infer<typeof AIGeneratedSchema>;

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}
