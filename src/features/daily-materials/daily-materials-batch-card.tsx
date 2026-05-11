import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyGenerationBatchView } from "./types";

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "生成中",
    generated: "已生成",
    skipped: "已暂停",
    imported: "已入库",
    partial: "部分处理",
    failed: "失败",
  };
  return labels[status] ?? status;
}

export function DailyMaterialsBatchCard({
  pendingDraftCount,
  latestBatch,
}: {
  pendingDraftCount: number;
  latestBatch: DailyGenerationBatchView | null;
}) {
  let strategySummary = "";
  if (latestBatch?.planJson) {
    try {
      const parsed = JSON.parse(latestBatch.planJson);
      strategySummary = typeof parsed.strategySummary === "string" ? parsed.strategySummary : "";
    } catch {
      strategySummary = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>当前状态</CardTitle>
        <CardDescription>待审核草稿 {pendingDraftCount} 篇。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {latestBatch ? (
          <div className="space-y-2 rounded-xl border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={latestBatch.status === "failed" ? "destructive" : "secondary"}>
                {formatStatus(latestBatch.status)}
              </Badge>
              <span className="text-muted-foreground">
                {new Date(latestBatch.createdAt).toLocaleString()}
              </span>
              <span className="text-muted-foreground">草稿 {latestBatch.draftCount} 篇</span>
            </div>
            {latestBatch.reason ? (
              <p className="break-words text-muted-foreground">原因：{latestBatch.reason}</p>
            ) : null}
            {latestBatch.error ? (
              <p className="break-words text-destructive">错误：{latestBatch.error}</p>
            ) : null}
            {strategySummary ? <p className="break-words">{strategySummary}</p> : null}
          </div>
        ) : (
          <p className="text-muted-foreground">还没有生成记录。</p>
        )}
      </CardContent>
    </Card>
  );
}
