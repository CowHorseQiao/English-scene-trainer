"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

import type { SaveTrainingRecordInput } from "./types";

export async function saveTrainingRecordAction(input: SaveTrainingRecordInput) {
  if (!input.materialId) {
    return { ok: false, message: "缺少语料 ID。" };
  }

  if (!input.prompt || !input.referenceAnswer) {
    return { ok: false, message: "训练记录缺少题目或参考答案。" };
  }

  await db.trainingRecord.create({
    data: {
      materialId: input.materialId,
      type: input.type,
      prompt: input.prompt,
      userAnswer: input.userAnswer,
      referenceAnswer: input.referenceAnswer,
      isCorrect: input.isCorrect,
      selfRating: input.selfRating,
    },
  });

  revalidatePath("/train");

  return { ok: true, message: "训练记录已保存。" };
}

// -- V2 actions --

export async function createPracticeSessionAction(input: {
  materialId: string;
  mode: "cloze" | "zh_to_en";
}) {
  if (!input.materialId) {
    return { ok: false, message: "缺少语料 ID。" };
  }

  if (input.mode !== "cloze" && input.mode !== "zh_to_en") {
    return { ok: false, message: "训练模式不合法。" };
  }

  const material = await db.material.findUnique({ where: { id: input.materialId } });
  if (!material) {
    return { ok: false, message: "语料不存在。" };
  }

  const session = await db.practiceSession.create({
    data: {
      materialId: input.materialId,
      mode: input.mode,
      status: "in_progress",
    },
  });

  revalidatePath("/train");

  return { ok: true, message: "训练会话已创建。", sessionId: session.id };
}

export async function savePracticeAnswersAction(input: {
  sessionId: string;
  answers: {
    exerciseIndex: number;
    type: string;
    prompt: string;
    userAnswer: string | null;
    referenceAnswer: string;
    isCorrect?: boolean;
    aiScore?: number;
    aiFeedback?: string;
  }[];
  totalCount: number;
  correctCount: number;
}) {
  if (!input.sessionId) {
    return { ok: false, message: "缺少会话 ID。" };
  }

  const session = await db.practiceSession.findUnique({ where: { id: input.sessionId } });
  if (!session) {
    return { ok: false, message: "训练会话不存在。" };
  }

  if (input.answers.length === 0) {
    return { ok: false, message: "答案列表不能为空。" };
  }

  await db.$transaction(async (tx) => {
    // Delete any existing answers for this session (retry scenario)
    await tx.practiceAnswer.deleteMany({ where: { sessionId: input.sessionId } });

    await tx.practiceAnswer.createMany({
      data: input.answers.map((a) => ({
        sessionId: input.sessionId,
        exerciseIndex: a.exerciseIndex,
        type: a.type,
        prompt: a.prompt,
        userAnswer: a.userAnswer,
        referenceAnswer: a.referenceAnswer,
        isCorrect: a.isCorrect,
        aiScore: a.aiScore,
        aiFeedback: a.aiFeedback,
      })),
    });

    await tx.practiceSession.update({
      where: { id: input.sessionId },
      data: {
        totalCount: input.totalCount,
        correctCount: input.correctCount,
        status: "completed",
        completedAt: new Date(),
      },
    });
  });

  revalidatePath("/train");

  return { ok: true, message: "训练结果已保存。" };
}
