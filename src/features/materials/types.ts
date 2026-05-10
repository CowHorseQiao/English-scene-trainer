export type MaterialActionResult = {
  ok: boolean;
  message: string;
  materialId?: string;
};

export type CreateMaterialInput = {
  categoryId: string;
  title: string;
  zh: string;
  en: string;
  contentType?: string;
  scene?: string;
  level?: string;
  usage?: string;
  note?: string;
  difficulty?: number;
  segments?: SegmentInput[];
};

export type UpdateMaterialInput = Omit<CreateMaterialInput, "categoryId"> & {
  categoryId?: string;
};

export type MoveMaterialInput = {
  materialId: string;
  categoryId: string;
};

export type CreateMaterialVariantInput = {
  type: string;
  text: string;
  note?: string;
};

export type MaterialSegmentInfo = {
  id: string;
  materialId: string;
  order: number;
  segmentType: string;
  zh: string;
  en: string;
  speaker: string | null;
  note: string | null;
};

export type SegmentInput = {
  order: number;
  segmentType?: string;
  zh: string;
  en: string;
  speaker?: string;
  note?: string;
};

export type MaterialVariantInfo = {
  id: string;
  materialId: string;
  type: string;
  text: string;
  note: string | null;
  createdAt: string;
};

export type MaterialTagInfo = {
  id: string;
  tagId: string;
  name: string;
};

export type MaterialListItem = {
  id: string;
  categoryId: string;
  title: string;
  zh: string;
  en: string;
  contentType: string;
  scene: string | null;
  level: string | null;
  note: string | null;
  usage: string | null;
  difficulty: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  variantsCount: number;
  tags: MaterialTagInfo[];
};

export type MaterialDetail = MaterialListItem & {
  category: {
    id: string;
    name: string;
  };
  variants: MaterialVariantInfo[];
  segments: MaterialSegmentInfo[];
};
