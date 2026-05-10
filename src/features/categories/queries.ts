import { db } from "@/lib/db";
import type { CategoryFlatNode, CategoryTreeNode } from "./types";
import { buildCategoryTree } from "./utils";

export async function getFlatCategories(): Promise<CategoryFlatNode[]> {
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      _count: {
        select: {
          children: true,
          materials: true,
        },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    parentId: category.parentId,
    name: category.name,
    description: category.description,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    childrenCount: category._count.children,
    materialsCount: category._count.materials,
  }));
}

export async function getCategoriesTree(): Promise<CategoryTreeNode[]> {
  const flatCategories = await getFlatCategories();
  return buildCategoryTree(flatCategories);
}

export async function getCategoryById(id: string): Promise<CategoryFlatNode | null> {
  const category = await db.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          children: true,
          materials: true,
        },
      },
    },
  });

  if (!category) return null;

  return {
    id: category.id,
    parentId: category.parentId,
    name: category.name,
    description: category.description,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    childrenCount: category._count.children,
    materialsCount: category._count.materials,
  };
}
