import { db } from "@/lib/db";
import { getOrCreateDailyGenerationSetting, parseCategoryPathJson, toSettingView } from "./daily-materials-utils";
import type { DailyMaterialsDashboard } from "./types";

export async function getDailyMaterialsDashboard(): Promise<DailyMaterialsDashboard> {
  const setting = await getOrCreateDailyGenerationSetting();

  const [pendingDraftCount, latestBatch, pendingDrafts] = await Promise.all([
    db.dailyGeneratedMaterialDraft.count({ where: { status: "pending" } }),
    db.dailyGenerationBatch.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { drafts: true },
        },
      },
    }),
    db.dailyGeneratedMaterialDraft.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return {
    setting: toSettingView(setting),
    pendingDraftCount,
    latestBatch: latestBatch
      ? {
          id: latestBatch.id,
          status: latestBatch.status,
          reason: latestBatch.reason,
          planJson: latestBatch.planJson,
          error: latestBatch.error,
          pendingDraftCountBefore: latestBatch.pendingDraftCountBefore,
          draftCount: latestBatch._count.drafts,
          createdAt: latestBatch.createdAt.toISOString(),
        }
      : null,
    pendingDrafts: pendingDrafts.map((draft) => ({
      id: draft.id,
      title: draft.title,
      contentType: draft.contentType,
      categoryPath: parseCategoryPathJson(draft.categoryPathJson),
      contentJson: draft.contentJson,
      status: draft.status,
      materialId: draft.materialId,
      createdAt: draft.createdAt.toISOString(),
    })),
  };
}
