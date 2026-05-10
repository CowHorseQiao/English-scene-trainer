import { db } from "@/lib/db";
import type { MaterialDetail, MaterialListItem } from "./types";

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

export async function getMaterialsByCategoryId(
  categoryId: string,
): Promise<MaterialListItem[]> {
  const materials = await db.material.findMany({
    where: {
      categoryId,
      isArchived: false,
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          variants: true,
        },
      },
    },
  });

  return materials.map((material) => ({
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
  }));
}

export async function getMaterialById(id: string): Promise<MaterialDetail | null> {
  const material = await db.material.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      variants: {
        orderBy: [{ createdAt: "asc" }],
      },
      segments: {
        orderBy: [{ order: "asc" }],
      },
      tags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          variants: true,
        },
      },
    },
  });

  if (!material) return null;

  return {
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
    category: material.category,
    variants: material.variants.map((variant) => ({
      id: variant.id,
      materialId: variant.materialId,
      type: variant.type,
      text: variant.text,
      note: variant.note,
      createdAt: variant.createdAt.toISOString(),
    })),
    segments: material.segments.map((segment) => ({
      id: segment.id,
      materialId: segment.materialId,
      order: segment.order,
      segmentType: segment.segmentType,
      zh: segment.zh,
      en: segment.en,
      speaker: segment.speaker,
      note: segment.note,
    })),
  };
}
