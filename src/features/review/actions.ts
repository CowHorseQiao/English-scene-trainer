"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

import type { ReviewResult } from "./types";
import { getReviewUpdate } from "./review-utils";

const REVIEW_RESULTS: ReviewResult[] = ["known", "unclear", "unknown"];

export async function reviewFavoriteAction(input: {
  favoriteId: string;
  result: ReviewResult;
}) {
  if (!input.favoriteId) {
    return {
      ok: false,
      message: "缺少收藏项 id。",
    };
  }

  if (!REVIEW_RESULTS.includes(input.result)) {
    return {
      ok: false,
      message: "复习结果不合法。",
    };
  }

  const favorite = await db.favorite.findUnique({
    where: {
      id: input.favoriteId,
    },
    select: {
      id: true,
      reviewStage: true,
    },
  });

  if (!favorite) {
    return {
      ok: false,
      message: "收藏项不存在，可能已经被删除。",
    };
  }

  const next = getReviewUpdate(favorite.reviewStage, input.result);

  await db.$transaction([
    db.favorite.update({
      where: {
        id: favorite.id,
      },
      data: {
        reviewStage: next.reviewStage,
        nextReviewAt: next.nextReviewAt,
        lastReviewAt: next.lastReviewAt,
      },
    }),
    db.reviewLog.create({
      data: {
        favoriteId: favorite.id,
        result: input.result,
      },
    }),
  ]);

  revalidatePath("/review");

  return {
    ok: true,
    message: "复习状态已更新。",
  };
}
