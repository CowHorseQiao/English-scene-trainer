import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ImportBatchInput } from "./types";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  sentence: "单句",
  monologue: "独白",
  dialogue: "对话",
  article: "短文",
  interview: "访谈",
  ielts: "雅思",
};

type ImportPreviewProps = {
  data: ImportBatchInput;
};

export function ImportPreview({ data }: ImportPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          导入预览
          <Badge variant="secondary">{data.materials.length} 条语料</Badge>
        </CardTitle>
        <div className="space-y-1 text-sm text-muted-foreground">
          {data.batchTitle ? <p>批次标题：{data.batchTitle}</p> : null}
          {data.source ? <p>来源：{data.source}</p> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.materials.map((material, index) => {
          const ct = material.contentType || "sentence";
          const typeLabel = CONTENT_TYPE_LABELS[ct] || ct;

          return (
            <div key={`${material.title}-${index}`} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">#{index + 1}</Badge>
                <h3 className="font-medium">{material.title}</h3>
                <Badge>{typeLabel}</Badge>
                <Badge variant="secondary">难度 {material.difficulty ?? 1}</Badge>
                {material.level ? <Badge variant="outline">{material.level}</Badge> : null}
              </div>

              {ct === "sentence" ? (
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="font-medium">中文：</span>
                    {material.zh}
                  </p>
                  <p>
                    <span className="font-medium">英文：</span>
                    {material.en}
                  </p>
                </div>
              ) : null}

              {material.segments && material.segments.length > 0 ? (
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-medium">段落/对话行（{material.segments.length} 段）</p>
                  {material.segments.slice(0, 3).map((seg, si) => (
                    <div key={si} className="rounded-md bg-muted p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        {seg.speaker ? <Badge variant="secondary" className="text-xs">{seg.speaker}</Badge> : null}
                        <span>#{seg.order + 1}</span>
                      </div>
                      <p className="text-sm">{seg.en}</p>
                      <p className="text-sm text-muted-foreground mt-1">{seg.zh}</p>
                    </div>
                  ))}
                  {material.segments.length > 3 ? (
                    <p className="text-xs text-muted-foreground">
                      ... 还有 {material.segments.length - 3} 段
                    </p>
                  ) : null}
                </div>
              ) : null}

              {material.scene ? (
                <p className="mt-3 text-sm">
                  <span className="font-medium">场景：</span>
                  {material.scene}
                </p>
              ) : null}
              {material.usage ? (
                <p className="text-sm">
                  <span className="font-medium">用法：</span>
                  {material.usage}
                </p>
              ) : null}
              {material.note ? (
                <p className="text-sm">
                  <span className="font-medium">备注：</span>
                  {material.note}
                </p>
              ) : null}

              {material.variants.length > 0 ? (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">替代表达</p>
                    {material.variants.map((variant, variantIndex) => (
                      <div key={`${variant.text}-${variantIndex}`} className="rounded-md bg-muted p-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge>{variant.type}</Badge>
                          {variant.note ? <span className="text-muted-foreground">{variant.note}</span> : null}
                        </div>
                        <p className="mt-2">{variant.text}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {material.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {material.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
