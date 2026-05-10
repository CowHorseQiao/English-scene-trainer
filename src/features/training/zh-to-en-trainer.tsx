"use client";

import { Textarea } from "@/components/ui/textarea";

import type { TrainingMaterial } from "./types";

type ZhToEnTrainerProps = {
  material: TrainingMaterial;
  answer: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function ZhToEnTrainer({
  material,
  answer,
  disabled,
  onChange,
}: ZhToEnTrainerProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-md bg-muted p-4">
        <p className="text-sm text-muted-foreground">请翻译成英文</p>
        <p className="mt-1 text-lg leading-8">{material.zh}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">你的英文表达</label>
        <Textarea
          value={answer}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          rows={6}
          placeholder="输入你的英文表达。第一版不做 AI 批改，提交后对照参考答案并自评。"
        />
      </div>
    </div>
  );
}
