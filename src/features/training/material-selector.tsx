"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { TrainableMaterial } from "./types";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  sentence: "句子",
  monologue: "独白",
  dialogue: "对话",
  article: "短文",
  interview: "访谈",
  ielts: "雅思",
};

const CONTENT_TYPE_OPTIONS = [
  { value: "", label: "全部类型" },
  { value: "sentence", label: "句子" },
  { value: "monologue", label: "独白" },
  { value: "dialogue", label: "对话" },
  { value: "article", label: "短文" },
  { value: "interview", label: "访谈" },
  { value: "ielts", label: "雅思" },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "创建时间" },
  { value: "updatedAt", label: "更新时间" },
];

type MaterialSelectorProps = {
  materials: TrainableMaterial[];
  total: number;
  categories: { id: string; name: string }[];
  currentContentType: string;
  currentCategoryId: string;
  currentSort: string;
  hasParams: boolean;
};

export function MaterialSelector({
  materials,
  total,
  categories,
  currentContentType,
  currentCategoryId,
  currentSort,
  hasParams,
}: MaterialSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    // Reset materialId when filters change
    if (!("materialId" in updates)) {
      params.delete("materialId");
    }
    router.push(`/train?${params.toString()}`);
  }

  if (materials.length === 0 && !hasParams) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="font-medium">暂无可以训练的语料</p>
            <p className="mt-2 text-sm text-muted-foreground">
              先在场景库中创建或导入语料。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-muted/20 p-2 shadow-sm sm:gap-3">
        <select
          className="h-10 min-w-[8rem] flex-1 rounded-xl border bg-background px-3 text-sm outline-none sm:h-9 sm:max-w-44 sm:flex-none"
          value={currentCategoryId}
          onChange={(e) => updateParams({ categoryId: e.target.value })}
        >
          <option value="">全部分类</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          className="h-10 min-w-[7.25rem] flex-1 rounded-xl border bg-background px-3 text-sm outline-none sm:h-9 sm:max-w-32 sm:flex-none"
          value={currentContentType}
          onChange={(e) => updateParams({ contentType: e.target.value })}
        >
          {CONTENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="h-10 min-w-[7.75rem] flex-1 rounded-xl border bg-background px-3 text-sm outline-none sm:h-9 sm:max-w-36 sm:flex-none"
          value={currentSort}
          onChange={(e) => updateParams({ sort: e.target.value })}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="ml-auto rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
          共 {total} 篇
        </span>
      </div>

      {materials.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="font-medium">没有匹配的语料</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {materials.map((material) => (
            <Card
              key={material.id}
              className="min-w-0 cursor-pointer rounded-2xl transition-all hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-md"
              onClick={() => updateParams({ materialId: material.id })}
            >
              <CardHeader>
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 min-w-0 flex-1 break-words text-base leading-snug">
                    {material.title}
                  </CardTitle>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="shrink-0 rounded-full text-xs">
                    {CONTENT_TYPE_LABELS[material.contentType] || material.contentType}
                  </Badge>
                  <span className="min-w-0 max-w-full break-words">{material.category.name}</span>
                  <span className="shrink-0">难度 {material.difficulty}</span>
                  {material.segmentCount > 0 ? (
                    <span className="shrink-0">{material.segmentCount} 段</span>
                  ) : null}
                  {material.scene ? (
                    <Badge variant="outline" className="max-w-full rounded-full break-words text-xs">
                      {material.scene}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
