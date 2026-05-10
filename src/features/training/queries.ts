import { db } from "@/lib/db";

import type { TrainingMaterial, TrainableMaterial, TrainableMaterialListParams } from "./types";
import {
  buildCategoryOptions,
  collectDescendantCategoryIds,
  shuffleArray,
} from "./utils";

export async function getTrainingCategoryOptions() {
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return buildCategoryOptions(categories);
}

type GetTrainingMaterialsInput = {
  categoryId: string;
  includeChildren: boolean;
  count: number;
};

export async function getTrainingMaterials({
  categoryId,
  includeChildren,
  count,
}: GetTrainingMaterialsInput): Promise<TrainingMaterial[]> {
  const safeCount = Math.min(Math.max(Number(count) || 10, 1), 100);

  let categoryIds = [categoryId];

  if (includeChildren) {
    const categories = await db.category.findMany({
      select: {
        id: true,
        parentId: true,
      },
    });
    categoryIds = collectDescendantCategoryIds(categories, categoryId);
  }

  const materials = await db.material.findMany({
    where: {
      categoryId: {
        in: categoryIds,
      },
      isArchived: false,
    },
    include: {
      variants: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return shuffleArray(materials).slice(0, safeCount).map((material) => ({
    id: material.id,
    title: material.title,
    zh: material.zh,
    en: material.en,
    scene: material.scene,
    level: material.level,
    usage: material.usage,
    note: material.note,
    difficulty: material.difficulty,
    variants: material.variants.map((variant) => ({
      id: variant.id,
      type: variant.type,
      text: variant.text,
      note: variant.note,
    })),
  }));
}

// -- V2 queries --

export async function getTrainableCategories() {
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  return categories;
}

export async function getTrainableMaterials(
  params: TrainableMaterialListParams = {},
): Promise<{ materials: TrainableMaterial[]; total: number }> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 12));
  const sort = params.sort === "updatedAt" ? "updatedAt" : "createdAt";

  const where: Record<string, unknown> = { isArchived: false };
  if (params.contentType) where.contentType = params.contentType;
  if (params.categoryId) where.categoryId = params.categoryId;

  const [materials, total] = await Promise.all([
    db.material.findMany({
      where,
      orderBy: [{ [sort]: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        contentType: true,
        scene: true,
        level: true,
        difficulty: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true } },
        _count: { select: { segments: true } },
      },
    }),
    db.material.count({ where }),
  ]);

  return {
    materials: materials.map((m) => ({
      id: m.id,
      title: m.title,
      contentType: m.contentType,
      scene: m.scene,
      level: m.level,
      difficulty: m.difficulty,
      category: m.category,
      segmentCount: m._count.segments,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })),
    total,
  };
}

export async function getPracticeSession(id: string) {
  return db.practiceSession.findUnique({
    where: { id },
    include: {
      material: {
        include: {
          segments: { orderBy: { order: "asc" } },
          category: { select: { id: true, name: true } },
        },
      },
      answers: { orderBy: { exerciseIndex: "asc" } },
    },
  });
}
