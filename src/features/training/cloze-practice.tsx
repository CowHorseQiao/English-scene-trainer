"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { savePracticeAnswersAction } from "./actions";
import { PracticeResult } from "./practice-result";
import type { ClozeSegment } from "./training-schemas";
import type { PracticeSegment } from "./types";

type ClozePracticeProps = {
  sessionId: string;
  materialId: string;
  materialTitle: string;
  segments: PracticeSegment[];
};

export function ClozePractice({ sessionId, materialId, materialTitle, segments }: ClozePracticeProps) {
  const [phase, setPhase] = useState<"loading" | "practicing" | "result">("loading");
  const [error, setError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<ClozeSegment[] | null>(null);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [result, setResult] = useState<{
    totalBlanks: number;
    correctBlanks: number;
    items: {
      segmentIndex: number;
      enWithBlanks: string;
      blanks: {
        index: number;
        userAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
        type: string;
        explanation: string;
      }[];
    }[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadExercises() {
      try {
        const response = await fetch("/api/training/cloze/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialId }),
        });
        const data = await response.json();
        if (!data.ok) {
          if (!cancelled) setError(data.error || "生成失败");
          return;
        }
        if (!cancelled) {
          setExercises(data.data.segments);
          setPhase("practicing");
        }
      } catch {
        if (!cancelled) setError("网络请求失败，请检查网络连接。");
      }
    }

    loadExercises();
    return () => { cancelled = true; };
  }, [materialId]);

  const globalBlanks = useMemo(() => {
    if (!exercises) return [];
    const all: { segmentIndex: number; blank: ClozeSegment["blanks"][number] }[] = [];
    for (const seg of exercises) {
      for (const blank of seg.blanks) {
        all.push({ segmentIndex: seg.segmentIndex, blank });
      }
    }
    return all;
  }, [exercises]);

  const segmentLabel = (index: number) => {
    const seg = segments.find((s) => s.order === index);
    if (seg?.speaker) return `段落 ${index + 1} — ${seg.speaker}`;
    if (segments.length > 1) return `段落 ${index + 1}`;
    return "";
  };

  function getAnswerKey(segmentIndex: number, blankIndex: number) {
    return `${segmentIndex}-${blankIndex}`;
  }

  function handleSubmit() {
    if (!exercises) return;

    // Calculate correctness
    let correctBlanks = 0;
    const items = exercises.map((seg) => {
      const blanks = seg.blanks.map((blank) => {
        const userAnswer = answers.get(getAnswerKey(seg.segmentIndex, blank.index))?.trim() ?? "";
        const isCorrect = userAnswer.toLowerCase() === blank.answer.toLowerCase();
        if (isCorrect) correctBlanks += 1;
        return {
          index: blank.index,
          userAnswer,
          correctAnswer: blank.answer,
          isCorrect,
          type: blank.type,
          explanation: blank.explanation,
        };
      });
      return { segmentIndex: seg.segmentIndex, enWithBlanks: seg.enWithBlanks, blanks };
    });

    const totalBlanks = globalBlanks.length;
    const resultData = { totalBlanks, correctBlanks, items };
    setResult(resultData);

    // Build prompt from enWithBlanks
    const answerInputs = exercises.map((seg) => ({
      exerciseIndex: seg.segmentIndex,
      type: "cloze",
      prompt: seg.enWithBlanks,
      userAnswer: seg.blanks
        .map((b) => `${b.index}: ${answers.get(getAnswerKey(seg.segmentIndex, b.index)) ?? ""}`)
        .join("; "),
      referenceAnswer: seg.blanks.map((b) => `${b.index}: ${b.answer}`).join("; "),
      isCorrect: seg.blanks.every((b) => {
        const ua = answers.get(getAnswerKey(seg.segmentIndex, b.index))?.trim() ?? "";
        return ua.toLowerCase() === b.answer.toLowerCase();
      }),
    }));

    startTransition(async () => {
      const saveResult = await savePracticeAnswersAction({
        sessionId,
        answers: answerInputs,
        totalCount: totalBlanks,
        correctCount: correctBlanks,
      });

      if (!saveResult.ok) {
        toast.error(saveResult.message);
      } else {
        setPhase("result");
      }
    });
  }

  if (phase === "loading") {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{materialTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">正在生成挖空练习...</p>
          <div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>生成失败</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button className="min-h-10 w-full sm:w-auto" onClick={() => { setError(null); setPhase("loading"); window.location.reload(); }}>
            重试
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "result" && result) {
    return <PracticeResult mode="cloze" {...result} />;
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{materialTitle}</CardTitle>
        </CardHeader>
      </Card>

      {exercises?.map((seg) => {
        const label = segmentLabel(seg.segmentIndex);
        return (
          <Card key={seg.segmentIndex} className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {label || "练习"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Render enWithBlanks with Input replacements */}
              <div className="text-base leading-8">
                {renderEnWithInputs(seg, answers, (key, value) => {
                  setAnswers((prev) => {
                    const next = new Map(prev);
                    next.set(key, value);
                    return next;
                  });
                })}
              </div>

              {/* Hint per blank if user wants */}
              <div className="space-y-2">
                {seg.blanks.map((blank) => (
                  blank.hint ? (
                    <p key={blank.index} className="text-xs text-muted-foreground">
                      空 {blank.index} 提示：{blank.hint}
                    </p>
                  ) : null
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex items-center gap-3">
        <Button type="button" className="min-h-10 w-full sm:w-auto" disabled={isPending} onClick={handleSubmit}>
          {isPending ? "提交中..." : "提交答案"}
        </Button>
      </div>
    </div>
  );
}

function renderEnWithInputs(
  seg: ClozeSegment,
  answers: Map<string, string>,
  onAnswer: (key: string, value: string) => void,
) {
  // Split enWithBlanks by blank pattern "____N____"
  const parts = seg.enWithBlanks.split(/(____(\d+)____)/g);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    // Check if this is a blank marker
    if (part.startsWith("____") && part.endsWith("____")) {
      i++; // skip the capture group for the number
      const numStr = parts[i];
      if (numStr) {
        const blank = seg.blanks.find((b) => b.index === Number(numStr));
        if (blank) {
          const key = `${seg.segmentIndex}-${blank.index}`;
          elements.push(
            <Input
              key={`blank-${blank.index}`}
              className="mx-1 inline-block h-10 w-28 max-w-[45vw] align-baseline text-sm sm:h-8 sm:w-32"
              value={answers.get(key) ?? ""}
              onChange={(e) => onAnswer(key, e.target.value)}
              placeholder={`空 ${blank.index}`}
            />,
          );
        }
      }
    } else {
      elements.push(<span key={`text-${i}`}>{part}</span>);
    }
  }

  return <p className="whitespace-pre-wrap">{elements}</p>;
}
