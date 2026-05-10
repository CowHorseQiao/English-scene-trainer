import { db } from "@/lib/db";
import type { MaterialListItem } from "./types";

export type MaterialFeedParams = {
  page?: number;
  pageSize?: number;
  sort?: "createdAt" | "updatedAt";
  contentType?: string;
  categoryId?: string;
};

export type MaterialFeedResult = {
  materials: MaterialListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function serializeTags(
  tags: Array<{
    id: string;
    tagId: string;
    tag: { name: string };
  }>,
) {
  return tags.map((item) => ({
    id: item.id,
    tagId: item.tagId,
    name: item.tag.name,
  }));
}

export async function getMaterialFeed(
  params: MaterialFeedParams = {},
): Promise<MaterialFeedResult> {
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
      include: {
        tags: { include: { tag: true } },
        _count: { select: { variants: true } },
      },
    }),
    db.material.count({ where }),
  ]);

  return {
    materials: materials.map((material) => ({
      id: material.id,
      categoryId: material.categoryId,
      title: material.title,
      zh: material.zh,
      en: material.en,
      contentType: material.contentType,
      scene: material.scene,
      level: material.level,
      note: material.note,
      usage: material.usage,
      difficulty: material.difficulty,
      isArchived: material.isArchived,
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
      variantsCount: material._count.variants,
      tags: serializeTags(material.tags),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getFlatCategoriesForFilter() {
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  return categories;
}
