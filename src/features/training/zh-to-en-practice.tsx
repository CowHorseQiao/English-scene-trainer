"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { savePracticeAnswersAction } from "./actions";
import { PracticeResult } from "./practice-result";
import type { AIScoredResult } from "./training-schemas";
import type { PracticeSegment } from "./types";

type ZhToEnPracticeProps = {
  sessionId: string;
  materialId: string;
  materialTitle: string;
  segments: PracticeSegment[];
};

export function ZhToEnPractice({ sessionId, materialTitle, segments }: ZhToEnPracticeProps) {
  const [phase, setPhase] = useState<"practicing" | "scoring" | "result">("practicing");
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Map<number, string>>(new Map());
  const [result, setResult] = useState<AIScoredResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const practiceSegments = segments.length > 0
    ? segments
    : [{ id: "main", order: 0, segmentType: "paragraph", zh: materialTitle, en: "", speaker: null, note: null } as PracticeSegment]; // fallback unused in practice

  const hasSegments = segments.length > 0;

  function handleSubmit() {
    if (!hasSegments) return;

    const userAnswersData = segments.map((seg) => ({
      segmentIndex: seg.order,
      userAnswer: userAnswers.get(seg.order)?.trim() ?? "",
    }));

    // Check all filled
    const emptyCount = userAnswersData.filter((a) => !a.userAnswer).length;
    if (emptyCount > 0) {
      toast.error(`还有 ${emptyCount} 个段落未填写。`);
      return;
    }

    setPhase("scoring");

    const referenceData = segments.map((seg) => ({
      segmentIndex: seg.order,
      en: seg.en,
      zh: seg.zh,
    }));

    fetch("/api/training/zh-to-en/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceSegments: referenceData, userAnswers: userAnswersData }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          setError(data.error || "评分失败");
          setPhase("practicing");
          return;
        }
        const scored = data.data as AIScoredResult;
        setResult(scored);

        // Save answers
        startTransition(async () => {
          const answerInputs = scored.segments.map((segScore) => {
            const ref = referenceData.find((r) => r.segmentIndex === segScore.segmentIndex);
            const user = userAnswersData.find((a) => a.segmentIndex === segScore.segmentIndex);
            return {
              exerciseIndex: segScore.segmentIndex,
              type: "zh_to_en",
              prompt: ref?.zh ?? "",
              userAnswer: user?.userAnswer ?? "",
              referenceAnswer: ref?.en ?? "",
              isCorrect: segScore.score >= 85,
              aiScore: segScore.score,
              aiFeedback: segScore.feedbackZh,
            };
          });

          const totalCount = answerInputs.length;
          const correctCount = answerInputs.filter((a) => a.isCorrect).length;

          const saveResult = await savePracticeAnswersAction({
            sessionId,
            answers: answerInputs,
            totalCount,
            correctCount,
          });

          if (!saveResult.ok) {
            toast.error(saveResult.message);
            return;
          }

          setPhase("result");
        });
      })
      .catch(() => {
        setError("网络请求失败，请检查网络连接。");
        setPhase("practicing");
      });
  }

  if (phase === "scoring") {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>{materialTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">AI 正在评分，请稍候...</p>
            <div className="h-8 w-full animate-pulse rounded-xl bg-muted" />
            <div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
            <div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>评分失败</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button className="min-h-10 w-full sm:w-auto" onClick={() => { setError(null); }}>
            重试
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "result" && result) {
    return (
      <PracticeResult
        mode="zh_to_en"
        overallScore={result.overallScore}
        summaryZh={result.summaryZh}
        priorityImprovements={result.priorityImprovements}
        segmentScores={result.segments}
        referenceSegments={segments.map((seg) => ({
          segmentIndex: seg.order,
          en: seg.en,
          zh: seg.zh,
        }))}
        userAnswers={segments.map((seg) => ({
          segmentIndex: seg.order,
          userAnswer: userAnswers.get(seg.order)?.trim() ?? "",
        }))}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{materialTitle}</CardTitle>
        </CardHeader>
      </Card>

      {practiceSegments
        .filter((seg) => seg.zh?.trim())
        .map((seg) => (
          <Card key={seg.id} className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {segments.length > 1 ? `段落 ${seg.order + 1}` : "翻译"}
                {seg.speaker ? ` — ${seg.speaker}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl bg-muted p-3 text-sm leading-7">
                {seg.zh}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">你的英文翻译</label>
                <Textarea
                  className="min-h-28 text-sm"
                  rows={3}
                  value={userAnswers.get(seg.order) ?? ""}
                  onChange={(e) => {
                    setUserAnswers((prev) => {
                      const next = new Map(prev);
                      next.set(seg.order, e.target.value);
                      return next;
                    });
                  }}
                  placeholder="输入你的英文翻译..."
                />
              </div>
            </CardContent>
          </Card>
        ))}

      <div className="flex items-center gap-3">
        <Button type="button" className="min-h-10 w-full sm:w-auto" disabled={isPending} onClick={handleSubmit}>
          {isPending ? "保存中..." : "提交并评分"}
        </Button>
      </div>
    </div>
  );
}
