"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type {
  CategoryActionResult,
  CreateCategoryInput,
  MoveCategoryInput,
  UpdateCategoryInput,
} from "./types";
import { buildCategoryTree, isCategoryDescendant } from "./utils";

function cleanOptionalText(value: string | undefined | null): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function validateCategoryName(name: string): string | null {
  const cleaned = cleanName(name);

  if (!cleaned) return "分类名称不能为空。";
  if (cleaned.length > 50) return "分类名称不能超过 50 个字符。";

  return null;
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<CategoryActionResult> {
  try {
    const nameError = validateCategoryName(input.name);
    if (nameError) return { ok: false, message: nameError };

    const name = cleanName(input.name);
    const parentId = input.parentId ?? null;

    if (parentId) {
      const parent = await db.category.findUnique({ where: { id: parentId } });
      if (!parent) return { ok: false, message: "父分类不存在，无法创建子分类。" };
    }

    const siblingCount = await db.category.count({ where: { parentId } });

    const category = await db.category.create({
      data: {
        name,
        parentId,
        description: cleanOptionalText(input.description),
        sortOrder: siblingCount,
      },
    });

    revalidatePath("/library");
    return { ok: true, message: "分类创建成功。", categoryId: category.id };
  } catch (error) {
    console.error("createCategory failed", error);
    return { ok: false, message: "分类创建失败，请查看终端日志。" };
  }
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<CategoryActionResult> {
  try {
    const nameError = validateCategoryName(input.name);
    if (nameError) return { ok: false, message: nameError };

    const category = await db.category.findUnique({ where: { id } });
    if (!category) return { ok: false, message: "分类不存在，无法更新。" };

    await db.category.update({
      where: { id },
      data: {
        name: cleanName(input.name),
        description: cleanOptionalText(input.description),
      },
    });

    revalidatePath("/library");
    return { ok: true, message: "分类更新成功。", categoryId: id };
  } catch (error) {
    console.error("updateCategory failed", error);
    return { ok: false, message: "分类更新失败，请查看终端日志。" };
  }
}

export async function deleteCategory(id: string): Promise<CategoryActionResult> {
  try {
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

    if (!category) return { ok: false, message: "分类不存在，无法删除。" };

    if (category._count.children > 0 || category._count.materials > 0) {
      return {
        ok: false,
        message: "该分类下还有子分类或语料，不能直接删除。请先移动或删除其中内容。",
      };
    }

    await db.category.delete({ where: { id } });

    revalidatePath("/library");
    return { ok: true, message: "分类删除成功。" };
  } catch (error) {
    console.error("deleteCategory failed", error);
    return { ok: false, message: "分类删除失败，请查看终端日志。" };
  }
}

export async function moveCategory(
  input: MoveCategoryInput,
): Promise<CategoryActionResult> {
  try {
    const targetParentId = input.parentId ?? null;

    if (input.id === targetParentId) {
      return { ok: false, message: "不能把分类移动到它自己下面。" };
    }

    const category = await db.category.findUnique({ where: { id: input.id } });
    if (!category) return { ok: false, message: "分类不存在，无法移动。" };

    if (targetParentId) {
      const parent = await db.category.findUnique({ where: { id: targetParentId } });
      if (!parent) return { ok: false, message: "目标父分类不存在。" };

      const allCategories = await db.category.findMany({
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

      const tree = buildCategoryTree(
        allCategories.map((item) => ({
          id: item.id,
          parentId: item.parentId,
          name: item.name,
          description: item.description,
          sortOrder: item.sortOrder,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          childrenCount: item._count.children,
          materialsCount: item._count.materials,
        })),
      );

      if (isCategoryDescendant(tree, input.id, targetParentId)) {
        return { ok: false, message: "不能把分类移动到自己的子分类下面。" };
      }
    }

    const siblingCount = await db.category.count({ where: { parentId: targetParentId } });

    await db.category.update({
      where: { id: input.id },
      data: {
        parentId: targetParentId,
        sortOrder: siblingCount,
      },
    });

    revalidatePath("/library");
    return { ok: true, message: "分类移动成功。", categoryId: input.id };
  } catch (error) {
    console.error("moveCategory failed", error);
    return { ok: false, message: "分类移动失败，请查看终端日志。" };
  }
}
