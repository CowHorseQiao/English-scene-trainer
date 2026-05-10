import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

import type { ReviewDashboardData, ReviewFavorite } from "./types";
import { getTomorrowRange } from "./review-utils";

const favoriteInclude = {
  material: {
    select: {
      id: true,
      title: true,
      zh: true,
      en: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.FavoriteInclude;

type RawFavorite = Prisma.FavoriteGetPayload<{ include: typeof favoriteInclude }>;

function toReviewFavorite(favorite: RawFavorite): ReviewFavorite {
  return {
    id: favorite.id,
    materialId: favorite.materialId,
    text: favorite.text,
    type: favorite.type,
    meaning: favorite.meaning,
    note: favorite.note,
    sourceSentence: favorite.sourceSentence,
    reviewStage: favorite.reviewStage,
    mastery: favorite.mastery,
    nextReviewAt: favorite.nextReviewAt.toISOString(),
    lastReviewAt: favorite.lastReviewAt ? favorite.lastReviewAt.toISOString() : null,
    createdAt: favorite.createdAt.toISOString(),
    updatedAt: favorite.updatedAt.toISOString(),
    material: favorite.material
      ? {
          id: favorite.material.id,
          title: favorite.material.title,
          zh: favorite.material.zh,
          en: favorite.material.en,
          category: favorite.material.category,
        }
      : null,
  };
}

export async function getReviewDashboardData(): Promise<ReviewDashboardData> {
  const now = new Date();
  const { tomorrow, dayAfter } = getTomorrowRange();

  const [due, upcoming, all] = await Promise.all([
    db.favorite.findMany({
      where: {
        nextReviewAt: {
          lte: now,
        },
      },
      include: favoriteInclude,
      orderBy: [{ nextReviewAt: "asc" }, { createdAt: "desc" }],
    }),
    db.favorite.findMany({
      where: {
        nextReviewAt: {
          gte: tomorrow,
          lt: dayAfter,
        },
      },
      include: favoriteInclude,
      orderBy: [{ nextReviewAt: "asc" }, { createdAt: "desc" }],
    }),
    db.favorite.findMany({
      include: favoriteInclude,
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  return {
    due: due.map(toReviewFavorite),
    upcoming: upcoming.map(toReviewFavorite),
    all: all.map(toReviewFavorite),
  };
}
