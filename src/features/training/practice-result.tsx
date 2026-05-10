"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SegmentScore } from "./training-schemas";

type ClozeResultItem = {
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
};

type ClozeResultProps = {
  mode: "cloze";
  totalBlanks: number;
  correctBlanks: number;
  items: ClozeResultItem[];
};

type ZhToEnResultProps = {
  mode: "zh_to_en";
  overallScore: number;
  summaryZh: string;
  priorityImprovements: string[];
  segmentScores: SegmentScore[];
  referenceSegments: { segmentIndex: number; en: string; zh: string }[];
  userAnswers: { segmentIndex: number; userAnswer: string }[];
};

type PracticeResultProps = ClozeResultProps | ZhToEnResultProps;

function getScoreColor(score: number) {
  if (score >= 85) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function getScoreBg(score: number) {
  if (score >= 85) return "bg-green-50 border-green-200";
  if (score >= 60) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

const BLANK_TYPE_LABELS: Record<string, string> = {
  keyword: "关键词",
  collocation: "搭配",
  grammar: "语法",
  phrase: "短语",
};

export function PracticeResult(props: PracticeResultProps) {
  return (
    <div className="space-y-6">
      {/* Overall summary */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>训练结果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.mode === "cloze" ? (
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-6 sm:text-left">
              <div>
                <p className={`text-4xl font-bold ${getScoreColor(Math.round((props.correctBlanks / props.totalBlanks) * 100))}`}>
                  {props.correctBlanks} / {props.totalBlanks}
                </p>
                <p className="text-sm text-muted-foreground">正确率</p>
              </div>
              <p className="text-sm text-muted-foreground">
                共 {props.totalBlanks} 个空格，答对 {props.correctBlanks} 个。
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-6">
                <div className={`rounded-2xl border px-6 py-4 text-center ${getScoreBg(props.overallScore)}`}>
                  <p className={`text-4xl font-bold ${getScoreColor(props.overallScore)}`}>
                    {props.overallScore}
                  </p>
                  <p className="text-sm text-muted-foreground">总分</p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed">{props.summaryZh}</p>
                  {props.priorityImprovements.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">优先改进：</p>
                      <div className="flex flex-wrap gap-1">
                        {props.priorityImprovements.map((item, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <Button asChild className="min-h-10 w-full sm:w-auto">
              <Link href="/train">返回训练列表</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Per-segment results */}
      {props.mode === "cloze" ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">答题详情</h3>
          {props.items.map((item) => (
            <Card key={item.segmentIndex} className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  段落 {item.segmentIndex + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border p-3 text-sm leading-7">
                  {item.enWithBlanks}
                </div>
                {item.blanks.map((blank) => (
                  <div key={blank.index} className="space-y-1 rounded-xl border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {BLANK_TYPE_LABELS[blank.type] || blank.type}
                      </Badge>
                      <span className="text-sm font-medium">空 {blank.index}</span>
                      <Badge variant={blank.isCorrect ? "default" : "destructive"} className="text-xs">
                        {blank.isCorrect ? "正确" : "错误"}
                      </Badge>
                    </div>
                    <div className="grid gap-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">你的答案：</span>
                        {blank.userAnswer || "未填写"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">正确答案：</span>
                        <span className="font-medium text-green-600">{blank.correctAnswer}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{blank.explanation}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">答题详情</h3>
          {props.segmentScores.map((score) => {
            const ref = props.referenceSegments.find((s) => s.segmentIndex === score.segmentIndex);
            const user = props.userAnswers.find((a) => a.segmentIndex === score.segmentIndex);
            return (
              <Card key={score.segmentIndex} className="rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm font-medium">
                      段落 {score.segmentIndex + 1}
                    </CardTitle>
                    <span className={`text-lg font-bold ${getScoreColor(score.score)}`}>
                      {score.score}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ref?.zh ? (
                    <div className="rounded-xl bg-muted p-3 text-sm">
                      <p className="text-xs text-muted-foreground mb-1">中文原文</p>
                      <p>{ref.zh}</p>
                    </div>
                  ) : null}
                  <div className="grid gap-2 text-sm">
                    <div className="rounded-xl border p-3">
                      <p className="text-xs text-muted-foreground mb-1">你的答案</p>
                      <p className="whitespace-pre-wrap break-words">{user?.userAnswer || "未作答"}</p>
                    </div>
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">参考 / 修正版</p>
                      <p className="whitespace-pre-wrap break-words">{score.correctedVersion}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>语义准确: {score.semanticAccuracy}</span>
                    <span>语法: {score.grammar}</span>
                    <span>自然度: {score.naturalness}</span>
                  </div>
                  <p className="text-sm">{score.feedbackZh}</p>
                  {score.keyIssues.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {score.keyIssues.map((issue, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
