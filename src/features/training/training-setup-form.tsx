"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { TrainingCategoryOption, TrainingMode } from "./types";

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

type TrainingSetupFormProps = {
  categories: TrainingCategoryOption[];
};

export function TrainingSetupForm({ categories }: TrainingSetupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<TrainingMode>(
    (searchParams.get("mode") as TrainingMode | null) ?? "cloze",
  );
  const [categoryId, setCategoryId] = useState(
    searchParams.get("categoryId") ?? categories[0]?.id ?? "",
  );
  const [includeChildren, setIncludeChildren] = useState(
    searchParams.get("includeChildren") !== "false",
  );
  const [showChinese, setShowChinese] = useState(
    searchParams.get("showChinese") !== "false",
  );
  const [count, setCount] = useState(Number(searchParams.get("count") ?? 10));

  const selectedMode = useMemo(
    () => modeOptions.find((item) => item.value === mode),
    [mode],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categoryId) return;

    const params = new URLSearchParams();
    params.set("mode", mode);
    params.set("categoryId", categoryId);
    params.set("includeChildren", String(includeChildren));
    params.set("showChinese", String(showChinese));
    params.set("count", String(Math.min(Math.max(count || 10, 1), 100)));

    router.push(`/train?${params.toString()}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>训练设置</CardTitle>
        <CardDescription>
          选择训练模式和语料范围。第一版不做 AI 批改，以主动回忆和自评为主。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            还没有分类。请先到“场景库”创建分类并添加语料。
          </div>
        ) : (
          <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="training-mode">
                训练模式
              </label>
              <select
                id="training-mode"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={mode}
                onChange={(event) => setMode(event.target.value as TrainingMode)}
              >
                {modeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {selectedMode?.description}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="training-category">
                训练分类
              </label>
              <select
                id="training-category"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {`${"— ".repeat(category.depth)}${category.name}`}
                  </option>
                ))}
              </select>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {categories.find((category) => category.id === categoryId)?.path}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="training-count">
                训练数量
              </label>
              <Input
                id="training-count"
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                建议先从 5～10 条开始。
              </p>
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeChildren}
                  onChange={(event) => setIncludeChildren(event.target.checked)}
                />
                包含子分类语料
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showChinese}
                  onChange={(event) => setShowChinese(event.target.checked)}
                />
                训练时显示中文
              </label>
            </div>

            <div className="md:col-span-2">
              <Button type="submit" disabled={!categoryId}>
                开始训练
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
