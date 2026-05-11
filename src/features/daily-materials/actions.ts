"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import {
  acceptDailyGeneratedDraft,
  rejectDailyGeneratedDraft,
  runDailyGeneration,
} from "./daily-materials-generator";
import { getOrCreateDailyGenerationSetting, normalizeOptional } from "./daily-materials-utils";
import { DailyGenerationSettingFormSchema, formatDailyZodError } from "./schemas";
import type { DailyActionResult, DailyGenerationSettingView } from "./types";

export async function saveDailyGenerationSettingAction(
  input: DailyGenerationSettingView,
): Promise<DailyActionResult> {
  const parsed = DailyGenerationSettingFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "设置保存失败。",
      errors: [formatDailyZodError(parsed.error)],
    };
  }

  const current = await getOrCreateDailyGenerationSetting();
  const data = parsed.data;

  await db.dailyGenerationSetting.update({
    where: { id: current.id },
    data: {
      enabled: data.enabled,
      generateTime: normalizeOptional(data.generateTime),
      totalCount: data.totalCount,
      dialogueCount: data.dialogueCount,
      monologueCount: data.monologueCount,
      interviewCount: data.interviewCount,
      articleCount: data.articleCount,
      ieltsCount: data.ieltsCount,
      allowSuggestCategory: data.allowSuggestCategory,
      autoImport: data.autoImport,
      maxPendingDrafts: data.maxPendingDrafts,
      learningGoal: normalizeOptional(data.learningGoal),
      focusNote: normalizeOptional(data.focusNote),
    },
  });

  revalidatePath("/add");

  return { ok: true, message: "设置已保存。" };
}

export async function runDailyGenerationAction(): Promise<DailyActionResult> {
  const result = await runDailyGeneration({ source: "manual" });
  revalidatePath("/add");
  return result;
}

export async function acceptDailyGeneratedDraftAction(
  draftId: string,
): Promise<DailyActionResult> {
  const result = await acceptDailyGeneratedDraft(draftId);
  revalidatePath("/add");
  revalidatePath("/library");
  if (result.materialId) {
    revalidatePath(`/library/material/${result.materialId}`);
    revalidatePath(`/read/${result.materialId}`);
  }
  return result;
}

export async function rejectDailyGeneratedDraftAction(
  draftId: string,
): Promise<DailyActionResult> {
  const result = await rejectDailyGeneratedDraft(draftId);
  revalidatePath("/add");
  return result;
}
