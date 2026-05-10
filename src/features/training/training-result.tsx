"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/features/favorites/favorite-button";

import type { SelfRating, TrainingMaterial } from "./types";

type TrainingResultProps = {
  material: TrainingMaterial;
  userAnswer: string;
  isCorrect?: boolean;
  isSaving?: boolean;
  onRate: (rating: SelfRating) => void;
};

const ratingOptions: { value: SelfRating; label: string; variant: "default" | "secondary" | "outline" | "destructive" }[] = [
  { value: "easy", label: "掌握", variant: "default" },
  { value: "normal", label: "基本会", variant: "secondary" },
  { value: "hard", label: "模糊", variant: "outline" },
  { value: "forgot", label: "不会", variant: "destructive" },
];

export function TrainingResult({
  material,
  userAnswer,
  isCorrect,
  isSaving,
  onRate,
}: TrainingResultProps) {
  return (
    <div className="space-y-5 rounded-md border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">参考答案</h3>
        {typeof isCorrect === "boolean" ? (
          <Badge variant={isCorrect ? "default" : "destructive"}>
            {isCorrect ? "挖空答案正确" : "挖空答案有误"}
          </Badge>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">你的答案</p>
        <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
          {userAnswer || "未填写"}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">主表达</p>
          <FavoriteButton
            materialId={material.id}
            defaultText={material.en}
            defaultType="sentence"
            sourceSentence={material.en}
            label="收藏主表达"
          />
        </div>
        <p className="rounded-md border p-3 leading-7">{material.en}</p>
      </div>

      {material.variants.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">替代表达</p>
          <div className="space-y-2">
            {material.variants.map((variant) => (
              <div key={variant.id} className="rounded-md border p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{variant.type}</Badge>
                    {variant.note ? (
                      <span className="text-xs text-muted-foreground">{variant.note}</span>
                    ) : null}
                  </div>
                  <FavoriteButton
                    materialId={material.id}
                    defaultText={variant.text}
                    defaultType="sentence"
                    sourceSentence={variant.text}
                    label="收藏"
                    variant="ghost"
                  />
                </div>
                <p className="leading-7">{variant.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {material.usage || material.note ? (
        <div className="grid gap-3 md:grid-cols-2">
          {material.usage ? (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">使用说明</p>
              <p className="mt-1 text-sm">{material.usage}</p>
            </div>
          ) : null}
          {material.note ? (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">备注</p>
              <p className="mt-1 text-sm">{material.note}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium">自评并进入下一题</p>
        <div className="flex flex-wrap gap-2">
          {ratingOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={option.variant}
              disabled={isSaving}
              onClick={() => onRate(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
