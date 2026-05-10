"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { ImportBatchSchema, formatZodError } from "./schemas";
import type { ImportActionResult } from "./types";

function normalizeOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    ),
  );
}

export async function importMaterialsFromJson(input: {
  categoryId: string;
  rawJson: string;
}): Promise<ImportActionResult> {
  const categoryId = input.categoryId?.trim();
  const rawJson = input.rawJson?.trim();

  if (!categoryId) {
    return {
      ok: false,
      message: "请先选择目标分类。",
    };
  }

  if (!rawJson) {
    return {
      ok: false,
      message: "请粘贴需要导入的 JSON。",
    };
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawJson);
  } catch (error) {
    return {
      ok: false,
      message: "JSON 解析失败，请检查是否存在多余逗号、中文引号或缺失括号。",
      errors: [error instanceof Error ? error.message : "未知 JSON 解析错误"],
    };
  }

  const parsed = ImportBatchSchema.safeParse(parsedJson);

  if (!parsed.success) {
    return {
      ok: false,
      message: "JSON 格式校验失败。",
      errors: formatZodError(parsed.error),
    };
  }

  const data = parsed.data;

  try {
    const result = await db.$transaction(async (tx) => {
      const category = await tx.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });

      if (!category) {
        throw new Error("目标分类不存在，请刷新页面后重新选择分类。");
      }

      const batch = await tx.importBatch.create({
        data: {
          categoryId,
          title: normalizeOptional(data.batchTitle),
          source: normalizeOptional(data.source),
          rawJson: JSON.stringify(data, null, 2),
          itemCount: data.materials.length,
        },
      });

      for (const material of data.materials) {
        const createdMaterial = await tx.material.create({
          data: {
            categoryId,
            title: material.title,
            zh: material.zh || "",
            en: material.en || "",
            contentType: material.contentType || "sentence",
            scene: normalizeOptional(material.scene),
            level: normalizeOptional(material.level),
            usage: normalizeOptional(material.usage),
            note: normalizeOptional(material.note),
            difficulty: material.difficulty ?? 1,
            variants: {
              create: material.variants.map((variant) => ({
                type: variant.type,
                text: variant.text,
                note: normalizeOptional(variant.note),
              })),
            },
          },
          select: { id: true },
        });

        if (material.segments && material.segments.length > 0) {
          await tx.materialSegment.createMany({
            data: material.segments.map((seg) => ({
              materialId: createdMaterial.id,
              order: seg.order,
              segmentType: seg.segmentType || "paragraph",
              zh: seg.zh.trim(),
              en: seg.en.trim(),
              speaker: normalizeOptional(seg.speaker),
              note: normalizeOptional(seg.note),
            })),
          });
        }

        const tagNames = normalizeTags(material.tags);

        for (const tagName of tagNames) {
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
            select: { id: true },
          });

          await tx.materialTag.create({
            data: {
              materialId: createdMaterial.id,
              tagId: tag.id,
            },
          });
        }
      }

      return {
        batchId: batch.id,
        importedCount: data.materials.length,
      };
    });

    revalidatePath("/add");
    revalidatePath("/import");
    revalidatePath("/library");

    return {
      ok: true,
      message: `导入成功，共导入 ${result.importedCount} 条语料。`,
      importedCount: result.importedCount,
      batchId: result.batchId,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        message: "JSON 格式校验失败。",
        errors: formatZodError(error),
      };
    }

    return {
      ok: false,
      message: "导入失败，数据库未写入半截数据。",
      errors: [error instanceof Error ? error.message : "未知数据库错误"],
    };
  }
}
