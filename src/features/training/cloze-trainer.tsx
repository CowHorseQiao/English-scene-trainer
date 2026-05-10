"use client";

import { Input } from "@/components/ui/input";

import type { ClozeQuestion, TrainingMaterial } from "./types";

type ClozeTrainerProps = {
  material: TrainingMaterial;
  question: ClozeQuestion;
  values: string[];
  showChinese: boolean;
  disabled?: boolean;
  onChange: (index: number, value: string) => void;
};

export function ClozeTrainer({
  material,
  question,
  values,
  showChinese,
  disabled,
  onChange,
}: ClozeTrainerProps) {
  return (
    <div className="space-y-5">
      {showChinese ? (
        <div className="rounded-md bg-muted p-4">
          <p className="text-sm text-muted-foreground">中文提示</p>
          <p className="mt-1">{material.zh}</p>
        </div>
      ) : null}

      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">挖空句子</p>
        <p className="mt-2 text-lg leading-8">{question.sentenceWithBlanks}</p>
      </div>

      {question.blanks.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          这条语料没有找到适合挖空的英文单词。可以直接查看答案并自评。
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {question.blanks.map((blank, index) => (
            <div key={`${blank.tokenIndex}-${index}`} className="space-y-1">
              <label className="text-sm font-medium">空 {index + 1}</label>
              <Input
                value={values[index] ?? ""}
                disabled={disabled}
                onChange={(event) => onChange(index, event.target.value)}
                placeholder="输入被挖掉的单词"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
