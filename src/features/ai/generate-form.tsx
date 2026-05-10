"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CategoryTreeNode } from "@/features/categories/types";
import type { ContentType, GeneratePreviewData, GenerateResult } from "./types";
import { GeneratePreview } from "./generate-preview";
import { confirmGenerateDraft } from "./actions";

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "monologue", label: "独白/自述" },
  { value: "dialogue", label: "对话" },
  { value: "article", label: "短文" },
  { value: "interview", label: "访谈" },
  { value: "ielts", label: "雅思语料" },
];

const LENGTHS = [
  { value: "short", label: "较短（约 3-5 段）" },
  { value: "medium", label: "中等（约 6-10 段）" },
  { value: "long", label: "较长（约 11-15 段）" },
];

type GenerateFormProps = {
  categories: CategoryTreeNode[];
};

export function GenerateForm({ categories }: GenerateFormProps) {
  const [categoryId, setCategoryId] = useState("");
  const [contentType, setContentType] = useState<ContentType>("monologue");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("3");
  const [length, setLength] = useState("medium");
  const [style, setStyle] = useState("");
  const [level, setLevel] = useState("");

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratePreviewData | null>(null);

  async function handleGenerate() {
    setError(null);
    setPreview(null);

    if (!categoryId) {
      setError("请选择目标分类。");
      return;
    }
    if (!topic.trim()) {
      setError("请输入场景描述。");
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          topic: topic.trim(),
          difficulty: Number(difficulty),
          length,
          style: style.trim(),
          level: level.trim() || undefined,
        }),
      });

      const result: GenerateResult = await response.json();

      if (!result.ok) {
        setError(result.details ? `${result.error}\n${result.details}` : result.error);
        return;
      }

      setPreview(result.data);
    } catch (fetchError) {
      console.error(fetchError);
      setError("网络请求失败，请检查网络连接后重试。");
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;

    setError(null);
    setGenerating(true);

    try {
      const result = await confirmGenerateDraft(categoryId, preview);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setPreview(null);
      setTopic("");
      setStyle("");
      setError(null);

      if (result.materialId) {
        window.location.href = `/library/material/${result.materialId}`;
      }
    } catch (confirmError) {
      console.error(confirmError);
      setError("写入数据库失败，请重试。");
    } finally {
      setGenerating(false);
    }
  }

  function handleRegenerate() {
    setPreview(null);
    setError(null);
  }

  if (preview) {
    return (
      <GeneratePreview
        data={preview}
        categoryName={categories.find((c) => c.id === categoryId)?.name ?? categoryId}
        onConfirm={handleConfirm}
        onRegenerate={handleRegenerate}
        loading={generating}
      />
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>AI 生成语料草稿</CardTitle>
        <p className="text-sm text-muted-foreground">
          描述场景，生成一份可编辑的草稿。
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">目标分类</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">语料类型</label>
            <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value}>
                    {ct.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">难度</label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">长度</label>
            <Select value={length} onValueChange={setLength}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LENGTHS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="gen-level">
              等级，可选
            </label>
            <Input
              id="gen-level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="例如：B2 / C1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="gen-topic">
            场景描述
          </label>
          <Textarea
            id="gen-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：保研英语面试中介绍自己的项目经历、雅思口语Part2描述一次难忘的旅行..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="gen-style">
            风格要求，可选
          </label>
          <Textarea
            id="gen-style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="例如：用词正式一些、适合口语练习、包含常见商务表达..."
            rows={1}
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive whitespace-pre-wrap">{error}</p>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button type="button" onClick={handleGenerate} disabled={generating}>
            {generating ? "生成中..." : "生成草稿"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
