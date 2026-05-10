import type { ReviewResult } from "./types";

export const REVIEW_INTERVALS = [0, 1, 3, 7, 15, 30] as const;

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getReviewUpdate(currentStage: number, result: ReviewResult) {
  const now = new Date();
  const maxStage = REVIEW_INTERVALS.length - 1;

  if (result === "known") {
    const nextStage = Math.min(currentStage + 1, maxStage);
    const intervalDays = REVIEW_INTERVALS[nextStage];

    return {
      reviewStage: nextStage,
      nextReviewAt: addDays(now, intervalDays),
      lastReviewAt: now,
    };
  }

  if (result === "unclear") {
    return {
      reviewStage: currentStage,
      nextReviewAt: addDays(now, 1),
      lastReviewAt: now,
    };
  }

  return {
    reviewStage: 0,
    nextReviewAt: now,
    lastReviewAt: now,
  };
}

export function getTomorrowRange() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  return { tomorrow, dayAfter };
}

export function formatReviewDate(value: string | null) {
  if (!value) return "暂无";

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getReviewResultLabel(result: ReviewResult) {
  const labels: Record<ReviewResult, string> = {
    known: "认识",
    unclear: "模糊",
    unknown: "不认识",
  };

  return labels[result];
}

export function getFavoriteTypeLabel(type: string) {
  const labels: Record<string, string> = {
    word: "单词",
    phrase: "短语",
    pattern: "句型",
    sentence: "句子",
    custom: "自定义",
  };

  return labels[type] ?? type;
}
