"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImportBatchSchema, formatZodError } from "./schemas";
import { SAMPLE_IMPORT_JSON } from "./sample-json";
import { importMaterialsFromJson } from "./actions";
import { ImportPreview } from "./import-preview";
import type { CategorySelectOption, ImportActionResult, ImportBatchInput } from "./types";

type ImportJsonFormProps = {
  categories: CategorySelectOption[];
};

function parseRawJson(rawJson: string):
  | { ok: true; data: ImportBatchInput }
  | { ok: false; errors: string[] } {
  if (!rawJson.trim()) {
    return { ok: false, errors: ["请先粘贴 JSON。"] };
  }

  try {
    const parsed = JSON.parse(rawJson);
    const result = ImportBatchSchema.safeParse(parsed);

    if (!result.success) {
      return { ok: false, errors: formatZodError(result.error) };
    }

    return { ok: true, data: result.data };
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : "未知 JSON 解析错误"],
    };
  }
}

export function ImportJsonForm({ categories }: ImportJsonFormProps) {
  const [categoryId, setCategoryId] = useState("");
  const [rawJson, setRawJson] = useState("");
  const [previewData, setPreviewData] = useState<ImportBatchInput | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<ImportActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId],
  );

  const canImport = Boolean(categoryId && previewData && !isPending);

  async function handleCopySample() {
    try {
      await navigator.clipboard.writeText(SAMPLE_IMPORT_JSON);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = SAMPLE_IMPORT_JSON;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleValidate() {
    setResult(null);
    const parsed = parseRawJson(rawJson);

    if (!parsed.ok) {
      setPreviewData(null);
      setErrors(parsed.errors);
      return;
    }

    setErrors([]);
    setPreviewData(parsed.data);
  }

  function handleConfirmImport() {
    setResult(null);

    if (!categoryId) {
      setErrors(["请先选择目标分类。"]);
      return;
    }

    const parsed = parseRawJson(rawJson);

    if (!parsed.ok) {
      setPreviewData(null);
      setErrors(parsed.errors);
      return;
    }

    setPreviewData(parsed.data);
    setErrors([]);

    startTransition(async () => {
      const actionResult = await importMaterialsFromJson({
        categoryId,
        rawJson,
      });

      setResult(actionResult);

      if (actionResult.ok) {
        setPreviewData(null);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>JSON 导入</CardTitle>
          <CardDescription>
            粘贴 JSON，先校验再导入。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">目标分类</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="选择语料要导入到哪个分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.path}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory ? (
              <p className="text-sm text-muted-foreground">
                当前选择：{selectedCategory.path}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="raw-json" className="text-sm font-medium">导入 JSON</label>
              <Button type="button" variant="outline" size="sm" onClick={handleCopySample}>
                {copied ? "已复制" : "复制示例"}
              </Button>
            </div>
            <Textarea
              id="raw-json"
              value={rawJson}
              onChange={(event) => {
                setRawJson(event.target.value);
                setPreviewData(null);
                setResult(null);
              }}
              placeholder="在此粘贴 JSON..."
              className="min-h-62.5 font-mono text-sm sm:min-h-105"
              spellCheck={false}
            />
          </div>

          {errors.length > 0 ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-medium">校验失败</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {errors.map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result ? (
            <div
              className={
                result.ok
                  ? "rounded-xl border bg-muted p-4 text-sm"
                  : "rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
              }
            >
              <p className="font-medium">{result.ok ? "导入完成" : "导入失败"}</p>
              <p className="mt-2">{result.message}</p>
              {!result.ok && result.errors?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {result.errors.map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={handleValidate} disabled={isPending}>
              校验并预览
            </Button>
            <Button type="button" onClick={handleConfirmImport} disabled={!canImport}>
              {isPending ? "导入中..." : "确认导入"}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            确认导入前会再次在服务端校验 JSON。导入使用数据库事务，失败时不会写入半截数据。
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {previewData ? (
          <ImportPreview data={previewData} />
        ) : (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">预览区</CardTitle>
              <CardDescription>点击校验后会显示即将导入的语料。</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              当前没有可预览内容。
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
