"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeneratePreviewData } from "./types";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  monologue: "独白/自述",
  dialogue: "对话",
  article: "短文",
  interview: "访谈",
  ielts: "雅思语料",
};

const SEGMENT_TYPE_LABELS: Record<string, string> = {
  paragraph: "段落",
  line: "对话行",
  qa: "问答",
};

type GeneratePreviewProps = {
  data: GeneratePreviewData;
  categoryName: string;
  onConfirm: () => void;
  onRegenerate: () => void;
  loading: boolean;
};

export function GeneratePreview({
  data,
  categoryName,
  onConfirm,
  onRegenerate,
  loading,
}: GeneratePreviewProps) {
  const typeLabel = CONTENT_TYPE_LABELS[data.contentType] || data.contentType;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>预览：{data.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              分类：{categoryName} · 类型：{typeLabel} · 难度：{data.difficulty}/5
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onRegenerate} disabled={loading}>
              重新生成
            </Button>
            <Button onClick={onConfirm} disabled={loading}>
              {loading ? "写入中..." : "确认导入"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {data.scene ? <Badge variant="secondary">{data.scene}</Badge> : null}
          {data.level ? <Badge variant="secondary">{data.level}</Badge> : null}
          {data.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {data.usage ? (
          <p className="mt-2 text-sm text-muted-foreground">{data.usage}</p>
        ) : null}
        {data.note ? (
          <p className="mt-1 text-sm text-muted-foreground">{data.note}</p>
        ) : null}
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <p className="text-sm font-medium">
            段落/对话行（共 {data.segments.length} 段）
          </p>

          {data.contentType === "dialogue" ? (
            <div className="space-y-3">
              {data.segments.map((seg) => (
                <div
                  key={seg.order}
                  className="flex gap-3 items-start rounded-lg bg-muted/30 p-3"
                >
                  {seg.speaker ? (
                    <Badge variant="secondary" className="mt-0.5 shrink-0">
                      {seg.speaker}
                    </Badge>
                  ) : null}
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{seg.en}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {seg.zh}
                    </p>
                    {seg.note ? (
                      <p className="text-xs text-muted-foreground/70">{seg.note}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {data.segments.map((seg) => (
                <div key={seg.order} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {SEGMENT_TYPE_LABELS[seg.segmentType] || seg.segmentType}{" "}
                      {seg.order + 1}
                    </span>
                    {seg.speaker ? (
                      <Badge variant="outline" className="text-xs">
                        {seg.speaker}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-sm leading-7 whitespace-pre-wrap">
                    {seg.en}
                  </div>
                  <p className="text-sm text-muted-foreground leading-7 whitespace-pre-wrap pl-2 border-l-2 border-muted">
                    {seg.zh}
                  </p>
                  {seg.note ? (
                    <p className="text-xs text-muted-foreground/70 pl-2">{seg.note}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
