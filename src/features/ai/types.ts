export type ContentType = "monologue" | "dialogue" | "article" | "interview" | "ielts";

export type GenerateFormInput = {
  categoryId: string;
  contentType: ContentType;
  topic: string;
  difficulty: number;
  length: string;
  style: string;
  level?: string;
};

export type SegmentPreview = {
  order: number;
  segmentType: string;
  speaker?: string;
  en: string;
  zh: string;
  note?: string;
};

export type GeneratePreviewData = {
  title: string;
  contentType: ContentType;
  scene?: string;
  level?: string;
  usage?: string;
  note?: string;
  difficulty: number;
  tags: string[];
  segments: SegmentPreview[];
};

export type GenerateResult =
  | { ok: true; data: GeneratePreviewData }
  | { ok: false; error: string; details?: string };
