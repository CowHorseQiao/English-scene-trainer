"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

import type {
  CreateFavoriteInput,
  FavoriteActionResult,
  FavoriteType,
  UpdateFavoriteInput,
} from "./types";

const favoriteTypes = new Set<FavoriteType>([
  "word",
  "phrase",
  "pattern",
  "sentence",
  "custom",
]);

function cleanRequiredText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function cleanOptionalText(value: string | undefined | null): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function normalizeFavoriteType(type: string): FavoriteType {
  return favoriteTypes.has(type as FavoriteType) ? (type as FavoriteType) : "custom";
}

function validateFavoriteInput(input: CreateFavoriteInput | UpdateFavoriteInput): string | null {
  const text = cleanRequiredText(input.text);
  if (!text) return "收藏内容不能为空。";
  if (text.length > 500) return "收藏内容不能超过 500 个字符。";
  if (input.meaning && input.meaning.length > 1000) return "中文意思不能超过 1000 个字符。";
  if (input.note && input.note.length > 1000) return "备注不能超过 1000 个字符。";
  if (input.sourceSentence && input.sourceSentence.length > 2000) return "来源句子不能超过 2000 个字符。";
  return null;
}

function revalidateFavoritePaths(materialId?: string | null) {
  revalidatePath("/review");
  revalidatePath("/train");
  if (materialId) revalidatePath(`/library/material/${materialId}`);
}

export async function createFavoriteAction(
  input: CreateFavoriteInput,
): Promise<FavoriteActionResult> {
  try {
    const error = validateFavoriteInput(input);
    if (error) return { ok: false, message: error };

    if (input.materialId) {
      const material = await db.material.findUnique({ where: { id: input.materialId } });
      if (!material) return { ok: false, message: "来源语料不存在，无法收藏。" };
    }

    const favorite = await db.favorite.create({
      data: {
        materialId: input.materialId || null,
        text: cleanRequiredText(input.text),
        type: normalizeFavoriteType(input.type),
        meaning: cleanOptionalText(input.meaning),
        note: cleanOptionalText(input.note),
        sourceSentence: cleanOptionalText(input.sourceSentence),
        reviewStage: 0,
        mastery: 0,
        nextReviewAt: new Date(),
      },
    });

    revalidateFavoritePaths(input.materialId);
    return { ok: true, message: "收藏成功。", favoriteId: favorite.id };
  } catch (error) {
    console.error("createFavoriteAction failed", error);
    return { ok: false, message: "收藏失败，请查看终端日志。" };
  }
}

export async function updateFavoriteAction(
  id: string,
  input: UpdateFavoriteInput,
): Promise<FavoriteActionResult> {
  try {
    const favorite = await db.favorite.findUnique({ where: { id } });
    if (!favorite) return { ok: false, message: "收藏项不存在，无法更新。" };

    const error = validateFavoriteInput(input);
    if (error) return { ok: false, message: error };

    if (input.materialId) {
      const material = await db.material.findUnique({ where: { id: input.materialId } });
      if (!material) return { ok: false, message: "来源语料不存在，无法更新收藏。" };
    }

    await db.favorite.update({
      where: { id },
      data: {
        materialId: input.materialId || null,
        text: cleanRequiredText(input.text),
        type: normalizeFavoriteType(input.type),
        meaning: cleanOptionalText(input.meaning),
        note: cleanOptionalText(input.note),
        sourceSentence: cleanOptionalText(input.sourceSentence),
      },
    });

    revalidateFavoritePaths(input.materialId ?? favorite.materialId);
    return { ok: true, message: "收藏已更新。", favoriteId: id };
  } catch (error) {
    console.error("updateFavoriteAction failed", error);
    return { ok: false, message: "收藏更新失败，请查看终端日志。" };
  }
}

export async function deleteFavoriteAction(id: string): Promise<FavoriteActionResult> {
  try {
    const favorite = await db.favorite.findUnique({ where: { id } });
    if (!favorite) return { ok: false, message: "收藏项不存在，无法删除。" };

    await db.favorite.delete({ where: { id } });

    revalidateFavoritePaths(favorite.materialId);
    return { ok: true, message: "收藏已删除。" };
  } catch (error) {
    console.error("deleteFavoriteAction failed", error);
    return { ok: false, message: "收藏删除失败，请查看终端日志。" };
  }
}
