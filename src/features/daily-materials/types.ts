export type DailyGenerationSettingView = {
  id: string;
  enabled: boolean;
  generateTime: string;
  totalCount: number;
  dialogueCount: number;
  monologueCount: number;
  interviewCount: number;
  articleCount: number;
  ieltsCount: number;
  allowSuggestCategory: boolean;
  autoImport: boolean;
  maxPendingDrafts: number;
  learningGoal: string;
  focusNote: string;
};

export type DailyGenerationBatchView = {
  id: string;
  status: string;
  reason: string | null;
  planJson: string | null;
  error: string | null;
  pendingDraftCountBefore: number | null;
  draftCount: number;
  createdAt: string;
};

export type DailyGeneratedMaterialDraftView = {
  id: string;
  title: string;
  contentType: string | null;
  categoryPath: string[];
  contentJson: string;
  status: string;
  materialId: string | null;
  createdAt: string;
};

export type DailyMaterialsDashboard = {
  setting: DailyGenerationSettingView;
  pendingDraftCount: number;
  latestBatch: DailyGenerationBatchView | null;
  pendingDrafts: DailyGeneratedMaterialDraftView[];
};

export type DailyActionResult = {
  ok: boolean;
  message: string;
  status?: string;
  reason?: string;
  batchId?: string;
  draftCount?: number;
  materialId?: string;
  errors?: string[];
};
