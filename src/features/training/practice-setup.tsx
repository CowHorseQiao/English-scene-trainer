"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createPracticeSessionAction } from "./actions";
import type { TrainableMaterial, TrainingMode } from "./types";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  sentence: "句子",
  monologue: "独白",
  dialogue: "对话",
  article: "短文",
  interview: "访谈",
  ielts: "雅思",
};

const modeOptions: { value: TrainingMode; label: string; description: string }[] = [
  {
    value: "cloze",
    label: "挖空补全",
    description: "随机挖掉英文句子中的关键词，适合记句块。",
  },
  {
    value: "zh_to_en",
    label: "中译英",
    description: "根据中文主动回忆英文表达，适合训练输出。",
  },
];

type PracticeSetupProps = {
  material: TrainableMaterial;
};

export function PracticeSetup({ material }: PracticeSetupProps) {
  const router = useRouter();
  const [mode, setMode] = useState<TrainingMode>("cloze");
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      const result = await createPracticeSessionAction({
        materialId: material.id,
        mode,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push(`/train?sessionId=${result.sessionId}`);
    });
  }

  return (
    <Card className="rounded-2xl border-primary/40 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">训练配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">已选语料：</span>
          <span>{material.title}</span>
          <Badge variant="secondary" className="rounded-full text-xs">
            {CONTENT_TYPE_LABELS[material.contentType] || material.contentType}
          </Badge>
          <span className="text-muted-foreground">{material.category.name}</span>
          {material.segmentCount > 0 ? (
            <span className="text-muted-foreground">{material.segmentCount} 段</span>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">训练模式</label>
          <div className="flex flex-wrap gap-2">
            {modeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`min-h-11 flex-1 basis-40 rounded-xl border px-3 py-2 text-left transition-colors ${
                  mode === opt.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary/70"
                    : "bg-background hover:bg-muted/50"
                }`}
                onClick={() => setMode(opt.value)}
              >
                <p className="font-medium">{opt.label}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" className="min-h-10 px-4" disabled={isPending} onClick={handleStart}>
            {isPending ? "创建中..." : "开始训练"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-10 px-4"
            onClick={() => router.push("/train")}
          >
            取消选择
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
