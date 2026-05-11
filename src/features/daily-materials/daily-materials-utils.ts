import { db } from "@/lib/db";
import type { DailyGenerationSettingView } from "./types";

export function normalizeOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    ),
  );
}

export function parseCategoryPathJson(value?: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

export async function getOrCreateDailyGenerationSetting() {
  const existing = await db.dailyGenerationSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) return existing;

  return db.dailyGenerationSetting.create({
    data: {},
  });
}

export function toSettingView(setting: Awaited<ReturnType<typeof getOrCreateDailyGenerationSetting>>): DailyGenerationSettingView {
  return {
    id: setting.id,
    enabled: setting.enabled,
    generateTime: setting.generateTime ?? "08:00",
    totalCount: setting.totalCount,
    dialogueCount: setting.dialogueCount,
    monologueCount: setting.monologueCount,
    interviewCount: setting.interviewCount,
    articleCount: setting.articleCount,
    ieltsCount: setting.ieltsCount,
    allowSuggestCategory: setting.allowSuggestCategory,
    autoImport: setting.autoImport,
    maxPendingDrafts: setting.maxPendingDrafts,
    learningGoal: setting.learningGoal ?? "",
    focusNote: setting.focusNote ?? "",
  };
}

export function getPauseMessage() {
  return "待审核语料已达到上限。先处理一些草稿后再生成。";
}
