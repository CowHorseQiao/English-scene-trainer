export type FavoriteType = "word" | "phrase" | "pattern" | "sentence" | "custom";

export type FavoriteActionResult = {
  ok: boolean;
  message: string;
  favoriteId?: string;
};

export type CreateFavoriteInput = {
  materialId?: string | null;
  text: string;
  type: FavoriteType;
  meaning?: string;
  note?: string;
  sourceSentence?: string;
};

export type UpdateFavoriteInput = CreateFavoriteInput;

export type FavoriteInfo = {
  id: string;
  materialId: string | null;
  text: string;
  type: FavoriteType;
  meaning: string | null;
  note: string | null;
  sourceSentence: string | null;
  reviewStage: number;
  mastery: number;
  nextReviewAt: string;
  lastReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
  material: {
    id: string;
    title: string;
  } | null;
};

export const favoriteTypeOptions: { value: FavoriteType; label: string }[] = [
  { value: "word", label: "单词" },
  { value: "phrase", label: "短语" },
  { value: "pattern", label: "句型" },
  { value: "sentence", label: "完整句子" },
  { value: "custom", label: "自定义片段" },
];

export function getFavoriteTypeLabel(type: FavoriteType) {
  return favoriteTypeOptions.find((item) => item.value === type)?.label ?? type;
}
