export type ReviewResult = "known" | "unclear" | "unknown";

export type ReviewMaterialRef = {
  id: string;
  title: string;
  zh: string;
  en: string;
  category?: {
    id: string;
    name: string;
  } | null;
};

export type ReviewFavorite = {
  id: string;
  materialId: string | null;
  text: string;
  type: string;
  meaning: string | null;
  note: string | null;
  sourceSentence: string | null;
  reviewStage: number;
  mastery: number;
  nextReviewAt: string;
  lastReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
  material: ReviewMaterialRef | null;
};

export type ReviewDashboardData = {
  due: ReviewFavorite[];
  upcoming: ReviewFavorite[];
  all: ReviewFavorite[];
};

export type AllFavoritesFilter = {
  type: string;
  categoryId: string;
};
