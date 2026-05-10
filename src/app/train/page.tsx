import { notFound } from "next/navigation";

import { MaterialSelector } from "@/features/training/material-selector";
import { PracticeSession } from "@/features/training/practice-session";
import { PracticeSetup } from "@/features/training/practice-setup";
import {
  getPracticeSession,
  getTrainableCategories,
  getTrainableMaterials,
} from "@/features/training/queries";
import type { PracticeSessionData, TrainableMaterial } from "@/features/training/types";

type TrainPageProps = {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    contentType?: string;
    categoryId?: string;
    materialId?: string;
    sessionId?: string;
  }>;
};

function serializePracticeSession(session: NonNullable<Awaited<ReturnType<typeof getPracticeSession>>>): PracticeSessionData {
  return {
    id: session.id,
    materialId: session.materialId,
    mode: session.mode as "cloze" | "zh_to_en",
    status: session.status,
    totalCount: session.totalCount,
    correctCount: session.correctCount,
    material: {
      id: session.material.id,
      title: session.material.title,
      contentType: session.material.contentType,
      zh: session.material.zh,
      en: session.material.en,
      scene: session.material.scene,
      level: session.material.level,
      difficulty: session.material.difficulty,
      category: session.material.category,
      segments: session.material.segments.map((seg) => ({
        id: seg.id,
        order: seg.order,
        segmentType: seg.segmentType,
        zh: seg.zh,
        en: seg.en,
        speaker: seg.speaker,
        note: seg.note,
      })),
    },
  };
}

export default async function TrainPage({ searchParams }: TrainPageProps) {
  const params = await searchParams;

  // Practice session in progress
  const sessionId = params.sessionId;
  if (sessionId) {
    const session = await getPracticeSession(sessionId);
    if (!session) notFound();
    return (
      <main className="space-y-6">
        <PracticeSession session={serializePracticeSession(session)} />
      </main>
    );
  }

  // Material list + setup
  const sort = params.sort === "updatedAt" ? "updatedAt" : "createdAt";
  const contentType = params.contentType || "";
  const categoryId = params.categoryId || "";
  const materialId = params.materialId;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ materials, total }, categories] = await Promise.all([
    getTrainableMaterials({ page, sort, contentType, categoryId }),
    getTrainableCategories(),
  ]);

  let selectedMaterial: TrainableMaterial | null = null;
  if (materialId) {
    const found = materials.find((m) => m.id === materialId);
    if (found) {
      selectedMaterial = found;
    }
  }

  return (
    <main className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold">训练</h1>
        <p className="mt-2 text-muted-foreground">
          选择语料开始练习。
        </p>
      </section>

      {selectedMaterial ? (
        <PracticeSetup material={selectedMaterial} />
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-medium">可训练语料</h2>
        <MaterialSelector
          materials={materials}
          total={total}
          categories={categories}
          currentContentType={contentType}
          currentCategoryId={categoryId}
          currentSort={sort}
          hasParams={Boolean(contentType || categoryId || params.sort)}
        />
      </section>
    </main>
  );
}
