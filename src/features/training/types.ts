export type TrainingMode = "cloze" | "zh_to_en";

export type SelfRating = "easy" | "normal" | "hard" | "forgot";

export type TrainingCategoryOption = {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  depth: number;
};

export type TrainingVariant = {
  id: string;
  type: string;
  text: string;
  note: string | null;
};

export type TrainingMaterial = {
  id: string;
  title: string;
  zh: string;
  en: string;
  scene: string | null;
  level: string | null;
  usage: string | null;
  note: string | null;
  difficulty: number;
  variants: TrainingVariant[];
};

export type TrainingSetup = {
  mode: TrainingMode;
  categoryId: string;
  includeChildren: boolean;
  count: number;
  showChinese: boolean;
};

export type ClozeBlank = {
  tokenIndex: number;
  answer: string;
};

export type ClozeQuestion = {
  sentenceWithBlanks: string;
  blanks: ClozeBlank[];
};

export type SaveTrainingRecordInput = {
  materialId: string;
  type: TrainingMode;
  prompt: string;
  userAnswer?: string;
  referenceAnswer: string;
  isCorrect?: boolean;
  selfRating: SelfRating;
};

// -- V2 types --

export type PracticeSessionStatus = "in_progress" | "completed" | "abandoned";

export type TrainableMaterial = {
  id: string;
  title: string;
  contentType: string;
  scene: string | null;
  level: string | null;
  difficulty: number;
  category: { id: string; name: string };
  segmentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TrainableMaterialListParams = {
  page?: number;
  pageSize?: number;
  sort?: "createdAt" | "updatedAt";
  contentType?: string;
  categoryId?: string;
};

// -- Practice session types --

export type PracticeSegment = {
  id: string;
  order: number;
  segmentType: string;
  zh: string;
  en: string;
  speaker: string | null;
  note: string | null;
};

export type PracticeMaterial = {
  id: string;
  title: string;
  contentType: string;
  zh: string;
  en: string;
  scene: string | null;
  level: string | null;
  difficulty: number;
  category: { id: string; name: string };
  segments: PracticeSegment[];
};

export type PracticeSessionData = {
  id: string;
  materialId: string;
  mode: "cloze" | "zh_to_en";
  status: string;
  totalCount: number;
  correctCount: number;
  material: PracticeMaterial;
};

export type PracticeAnswerInput = {
  exerciseIndex: number;
  type: string;
  prompt: string;
  userAnswer: string | null;
  referenceAnswer: string;
  isCorrect?: boolean;
  aiScore?: number;
  aiFeedback?: string;
};
