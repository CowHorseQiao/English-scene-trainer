"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { deleteMaterialAudioCache } from "@/lib/audio-cache";
import { getMaterialsByCategoryId } from "./queries";
import type {
  CreateMaterialInput,
  CreateMaterialVariantInput,
  MaterialActionResult,
  MoveMaterialInput,
  UpdateMaterialInput,
} from "./types";

function cleanOptionalText(value: string | undefined | null): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function cleanRequiredText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeDifficulty(value: number | undefined): number {
  if (!Number.isFinite(value)) return 1;
  const integer = Math.trunc(value ?? 1);
  if (integer < 1) return 1;
  if (integer > 5) return 5;
  return integer;
}

function validateMaterialInput(input: CreateMaterialInput | UpdateMaterialInput): string | null {
  if (!cleanRequiredText(input.title)) return "语料标题不能为空。";
  if (cleanRequiredText(input.title).length > 120) return "语料标题不能超过 120 个字符。";

  const isSentence = !input.contentType || input.contentType === "sentence";

  if (isSentence) {
    if (!input.zh.trim()) return "中文内容不能为空。";
    if (!input.en.trim()) return "英文内容不能为空。";
    if (input.zh.length > 2000) return "中文内容不能超过 2000 个字符。";
    if (input.en.length > 2000) return "英文内容不能超过 2000 个字符。";
  }

  if (!isSentence) {
    const segments = input.segments ?? [];
    if (segments.length === 0) return "请至少添加一个段落或对话行。";
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!seg.zh?.trim()) return `第 ${i + 1} 段中文内容不能为空。`;
      if (!seg.en?.trim()) return `第 ${i + 1} 段英文内容不能为空。`;
    }
  }

  return null;
}

function revalidateMaterialPaths(materialId?: string) {
  revalidatePath("/library");
  if (materialId) revalidatePath(`/library/material/${materialId}`);
}

export async function listMaterialsByCategoryAction(categoryId: string) {
  return getMaterialsByCategoryId(categoryId);
}

export async function createMaterial(
  input: CreateMaterialInput,
): Promise<MaterialActionResult> {
  try {
    const category = await db.category.findUnique({ where: { id: input.categoryId } });
    if (!category) return { ok: false, message: "目标分类不存在，无法创建语料。" };

    const error = validateMaterialInput(input);
    if (error) return { ok: false, message: error };

    const material = await db.$transaction(async (tx) => {
      const created = await tx.material.create({
        data: {
          categoryId: input.categoryId,
          title: cleanRequiredText(input.title),
          zh: input.zh.trim(),
          en: input.en.trim(),
          contentType: input.contentType || "sentence",
          scene: cleanOptionalText(input.scene),
          level: cleanOptionalText(input.level),
          usage: cleanOptionalText(input.usage),
          note: cleanOptionalText(input.note),
          difficulty: normalizeDifficulty(input.difficulty),
        },
      });

      const segments = input.segments ?? [];
      if (segments.length > 0) {
        await tx.materialSegment.createMany({
          data: segments.map((seg) => ({
            materialId: created.id,
            order: seg.order,
            segmentType: seg.segmentType || "paragraph",
            zh: seg.zh.trim(),
            en: seg.en.trim(),
            speaker: cleanOptionalText(seg.speaker),
            note: cleanOptionalText(seg.note),
          })),
        });
      }

      return created;
    });

    revalidateMaterialPaths(material.id);
    return { ok: true, message: "语料创建成功。", materialId: material.id };
  } catch (error) {
    console.error("createMaterial failed", error);
    return { ok: false, message: "语料创建失败，请查看终端日志。" };
  }
}

export async function updateMaterial(
  id: string,
  input: UpdateMaterialInput,
): Promise<MaterialActionResult> {
  try {
    const material = await db.material.findUnique({ where: { id } });
    if (!material) return { ok: false, message: "语料不存在，无法更新。" };

    if (input.categoryId) {
      const category = await db.category.findUnique({ where: { id: input.categoryId } });
      if (!category) return { ok: false, message: "目标分类不存在。" };
    }

    const error = validateMaterialInput(input);
    if (error) return { ok: false, message: error };

    await db.$transaction(async (tx) => {
      await tx.material.update({
        where: { id },
        data: {
          categoryId: input.categoryId ?? material.categoryId,
          title: cleanRequiredText(input.title),
          zh: input.zh.trim(),
          en: input.en.trim(),
          contentType: input.contentType || material.contentType,
          scene: cleanOptionalText(input.scene),
          level: cleanOptionalText(input.level),
          usage: cleanOptionalText(input.usage),
          note: cleanOptionalText(input.note),
          difficulty: normalizeDifficulty(input.difficulty),
        },
      });

      await tx.materialSegment.deleteMany({ where: { materialId: id } });

      const segments = input.segments ?? [];
      if (segments.length > 0) {
        await tx.materialSegment.createMany({
          data: segments.map((seg) => ({
            materialId: id,
            order: seg.order,
            segmentType: seg.segmentType || "paragraph",
            zh: seg.zh.trim(),
            en: seg.en.trim(),
            speaker: cleanOptionalText(seg.speaker),
            note: cleanOptionalText(seg.note),
          })),
        });
      }
    });

    revalidateMaterialPaths(id);
    return { ok: true, message: "语料更新成功。", materialId: id };
  } catch (error) {
    console.error("updateMaterial failed", error);
    return { ok: false, message: "语料更新失败，请查看终端日志。" };
  }
}

export async function deleteMaterial(id: string): Promise<MaterialActionResult> {
  try {
    const material = await db.material.findUnique({ where: { id } });
    if (!material) return { ok: false, message: "语料不存在，无法删除。" };

    // Clean audio cache before DB deletion (failure is non-fatal)
    try {
      deleteMaterialAudioCache(id);
    } catch (cacheError) {
      console.warn("Failed to delete audio cache for material", id, cacheError);
    }

    await db.material.delete({ where: { id } });

    revalidateMaterialPaths(id);
    return { ok: true, message: "语料删除成功。" };
  } catch (error) {
    console.error("deleteMaterial failed", error);
    return { ok: false, message: "语料删除失败，请查看终端日志。" };
  }
}

export async function moveMaterial(
  input: MoveMaterialInput,
): Promise<MaterialActionResult> {
  try {
    const material = await db.material.findUnique({ where: { id: input.materialId } });
    if (!material) return { ok: false, message: "语料不存在，无法移动。" };

    const category = await db.category.findUnique({ where: { id: input.categoryId } });
    if (!category) return { ok: false, message: "目标分类不存在，无法移动。" };

    await db.material.update({
      where: { id: input.materialId },
      data: { categoryId: input.categoryId },
    });

    revalidateMaterialPaths(input.materialId);
    return { ok: true, message: "语料移动成功。", materialId: input.materialId };
  } catch (error) {
    console.error("moveMaterial failed", error);
    return { ok: false, message: "语料移动失败，请查看终端日志。" };
  }
}

export async function addMaterialVariant(
  materialId: string,
  input: CreateMaterialVariantInput,
): Promise<MaterialActionResult> {
  try {
    const material = await db.material.findUnique({ where: { id: materialId } });
    if (!material) return { ok: false, message: "语料不存在，无法添加替代表达。" };

    const type = cleanRequiredText(input.type);
    const text = input.text.trim();

    if (!type) return { ok: false, message: "表达类型不能为空。" };
    if (!text) return { ok: false, message: "替代表达不能为空。" };
    if (text.length > 2000) return { ok: false, message: "替代表达不能超过 2000 个字符。" };

    await db.materialVariant.create({
      data: {
        materialId,
        type,
        text,
        note: cleanOptionalText(input.note),
      },
    });

    revalidateMaterialPaths(materialId);
    return { ok: true, message: "替代表达添加成功。", materialId };
  } catch (error) {
    console.error("addMaterialVariant failed", error);
    return { ok: false, message: "替代表达添加失败，请查看终端日志。" };
  }
}

export async function deleteMaterialVariant(
  variantId: string,
): Promise<MaterialActionResult> {
  try {
    const variant = await db.materialVariant.findUnique({ where: { id: variantId } });
    if (!variant) return { ok: false, message: "替代表达不存在，无法删除。" };

    await db.materialVariant.delete({ where: { id: variantId } });

    revalidateMaterialPaths(variant.materialId);
    return { ok: true, message: "替代表达删除成功。", materialId: variant.materialId };
  } catch (error) {
    console.error("deleteMaterialVariant failed", error);
    return { ok: false, message: "替代表达删除失败，请查看终端日志。" };
  }
}

export async function addMaterialTag(
  materialId: string,
  tagName: string,
): Promise<MaterialActionResult> {
  try {
    const material = await db.material.findUnique({ where: { id: materialId } });
    if (!material) return { ok: false, message: "语料不存在，无法添加标签。" };

    const name = cleanRequiredText(tagName);
    if (!name) return { ok: false, message: "标签名称不能为空。" };
    if (name.length > 30) return { ok: false, message: "标签名称不能超过 30 个字符。" };

    const tag = await db.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });

    const existing = await db.materialTag.findUnique({
      where: {
        materialId_tagId: {
          materialId,
          tagId: tag.id,
        },
      },
    });

    if (!existing) {
      await db.materialTag.create({
        data: {
          materialId,
          tagId: tag.id,
        },
      });
    }

    revalidateMaterialPaths(materialId);
    return { ok: true, message: existing ? "该标签已存在。" : "标签添加成功。", materialId };
  } catch (error) {
    console.error("addMaterialTag failed", error);
    return { ok: false, message: "标签添加失败，请查看终端日志。" };
  }
}

export async function deleteMaterialTag(
  materialId: string,
  tagId: string,
): Promise<MaterialActionResult> {
  try {
    await db.materialTag.deleteMany({
      where: {
        materialId,
        tagId,
      },
    });

    revalidateMaterialPaths(materialId);
    return { ok: true, message: "标签删除成功。", materialId };
  } catch (error) {
    console.error("deleteMaterialTag failed", error);
    return { ok: false, message: "标签删除失败，请查看终端日志。" };
  }
}
