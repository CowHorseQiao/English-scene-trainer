import { db } from "@/lib/db";

import type { FavoriteInfo, FavoriteType } from "./types";

function serializeFavorite(favorite: {
  id: string;
  materialId: string | null;
  text: string;
  type: string;
  meaning: string | null;
  note: string | null;
  sourceSentence: string | null;
  reviewStage: number;
  mastery: number;
  nextReviewAt: Date;
  lastReviewAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  material: { id: string; title: string } | null;
}): FavoriteInfo {
  return {
    id: favorite.id,
    materialId: favorite.materialId,
    text: favorite.text,
    type: favorite.type as FavoriteType,
    meaning: favorite.meaning,
    note: favorite.note,
    sourceSentence: favorite.sourceSentence,
    reviewStage: favorite.reviewStage,
    mastery: favorite.mastery,
    nextReviewAt: favorite.nextReviewAt.toISOString(),
    lastReviewAt: favorite.lastReviewAt?.toISOString() ?? null,
    createdAt: favorite.createdAt.toISOString(),
    updatedAt: favorite.updatedAt.toISOString(),
    material: favorite.material,
  };
}

export async function getFavorites(): Promise<FavoriteInfo[]> {
  const favorites = await db.favorite.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      material: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return favorites.map(serializeFavorite);
}

export async function getFavoriteById(id: string): Promise<FavoriteInfo | null> {
  const favorite = await db.favorite.findUnique({
    where: { id },
    include: {
      material: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return favorite ? serializeFavorite(favorite) : null;
}
