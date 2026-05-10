"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { saveTrainingRecordAction } from "./actions";
import { ClozeTrainer } from "./cloze-trainer";
import { TrainingResult } from "./training-result";
import type {
  ClozeQuestion,
  SelfRating,
  TrainingMaterial,
  TrainingMode,
} from "./types";
import {
  createClozeQuestion,
  getTrainingModeLabel,
  isClozeAnswerCorrect,
} from "./utils";
import { ZhToEnTrainer } from "./zh-to-en-trainer";

type TrainingSessionProps = {
  mode: TrainingMode;
  showChinese: boolean;
  materials: TrainingMaterial[];
};

export function TrainingSession({
  mode,
  showChinese,
  materials,
}: TrainingSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zhAnswer, setZhAnswer] = useState("");
  const [clozeAnswers, setClozeAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentMaterial = materials[currentIndex];

  const clozeQuestion = useMemo<ClozeQuestion | null>(() => {
    if (!currentMaterial || mode !== "cloze") return null;
    return createClozeQuestion(currentMaterial.en);
  }, [currentMaterial?.id, currentMaterial?.en, mode]);

  if (materials.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>没有可训练语料</CardTitle>
          <CardDescription>
            当前分类下没有语料。请先到场景库手动创建，或使用 JSON 导入模块导入。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/library">返回场景库</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!currentMaterial) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>本轮训练完成</CardTitle>
          <CardDescription>本轮共 {materials.length} 条语料。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/train">重新设置训练</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/library">返回场景库</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const userAnswer =
    mode === "cloze"
      ? clozeAnswers.map((answer, index) => `空${index + 1}: ${answer}`).join("; ")
      : zhAnswer;

  const clozeCorrect =
    mode === "cloze" && clozeQuestion
      ? clozeQuestion.blanks.every((blank, index) =>
          isClozeAnswerCorrect(blank.answer, clozeAnswers[index] ?? ""),
        )
      : undefined;

  const prompt =
    mode === "cloze" && clozeQuestion
      ? clozeQuestion.sentenceWithBlanks
      : currentMaterial.zh;

  function resetForNextQuestion() {
    setSubmitted(false);
    setZhAnswer("");
    setClozeAnswers([]);
    setCurrentIndex((value) => value + 1);
  }

  function handleRate(rating: SelfRating) {
    startTransition(async () => {
      const result = await saveTrainingRecordAction({
        materialId: currentMaterial.id,
        type: mode,
        prompt,
        userAnswer,
        referenceAnswer: currentMaterial.en,
        isCorrect: mode === "cloze" ? clozeCorrect : undefined,
        selfRating: rating,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("训练记录已保存");
      resetForNextQuestion();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{getTrainingModeLabel(mode)}</CardTitle>
            <CardDescription>
              第 {currentIndex + 1} / {materials.length} 题
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/train">重新设置</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{currentMaterial.title}</h2>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {currentMaterial.scene ? <span>场景：{currentMaterial.scene}</span> : null}
            {currentMaterial.level ? <span>等级：{currentMaterial.level}</span> : null}
            <span>难度：{currentMaterial.difficulty}</span>
          </div>
        </div>

        {mode === "cloze" && clozeQuestion ? (
          <ClozeTrainer
            material={currentMaterial}
            question={clozeQuestion}
            values={clozeAnswers}
            showChinese={showChinese}
            disabled={submitted}
            onChange={(index, value) => {
              setClozeAnswers((prev) => {
                const next = [...prev];
                next[index] = value;
                return next;
              });
            }}
          />
        ) : (
          <ZhToEnTrainer
            material={currentMaterial}
            answer={zhAnswer}
            disabled={submitted}
            onChange={setZhAnswer}
          />
        )}

        {!submitted ? (
          <Button type="button" onClick={() => setSubmitted(true)}>
            提交并查看答案
          </Button>
        ) : (
          <TrainingResult
            material={currentMaterial}
            userAnswer={userAnswer}
            isCorrect={mode === "cloze" ? clozeCorrect : undefined}
            isSaving={isPending}
            onRate={handleRate}
          />
        )}
      </CardContent>
    </Card>
  );
}
