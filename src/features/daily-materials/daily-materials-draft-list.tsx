"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  acceptDailyGeneratedDraftAction,
  rejectDailyGeneratedDraftAction,
} from "./actions";
import type { DailyGeneratedMaterialDraftView } from "./types";

type Props = {
  drafts: DailyGeneratedMaterialDraftView[];
};

function DraftPreview({ contentJson }: { contentJson: string }) {
  const parsed = useMemo(() => {
    try {
      return JSON.parse(contentJson);
    } catch {
      return null;
    }
  }, [contentJson]);

  if (!parsed) {
    return <p className="text-destructive">草稿内容无法预览。</p>;
  }

  return (
    <div className="space-y-3 rounded-xl bg-muted/40 p-3">
      {parsed.scene ? <p className="break-words text-muted-foreground">场景：{parsed.scene}</p> : null}
      {parsed.usage ? <p className="break-words text-muted-foreground">用途：{parsed.usage}</p> : null}
      {Array.isArray(parsed.tags) && parsed.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {parsed.tags.map((tag: string) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
      {Array.isArray(parsed.segments) && parsed.segments.length > 0 ? (
        <div className="space-y-2">
          {parsed.segments.slice(0, 8).map((segment: { order: number; speaker?: string; zh: string; en: string }) => (
            <div key={segment.order} className="space-y-1 rounded-lg border bg-background p-2">
              <p className="break-words text-muted-foreground">
                {segment.speaker ? `${segment.speaker}：` : ""}
                {segment.zh}
              </p>
              <p className="break-words">{segment.en}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {parsed.zh ? <p className="break-words text-muted-foreground">{parsed.zh}</p> : null}
          {parsed.en ? <p className="break-words">{parsed.en}</p> : null}
        </div>
      )}
    </div>
  );
}

export function DailyMaterialsDraftList({ drafts }: Props) {
  const [openId, setOpenId] = useState<string | null>(drafts[0]?.id ?? null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function accept(draftId: string) {
    setPendingId(draftId);
    startTransition(async () => {
      const result = await acceptDailyGeneratedDraftAction(draftId);
      setPendingId(null);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function reject(draftId: string) {
    if (!window.confirm("确定拒绝这篇草稿？")) return;

    setPendingId(draftId);
    startTransition(async () => {
      const result = await rejectDailyGeneratedDraftAction(draftId);
      setPendingId(null);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>待审核草稿</CardTitle>
        <CardDescription>
          {drafts.length > 0 ? `共有 ${drafts.length} 篇等待处理。` : "暂无待审核草稿。"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {drafts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
            暂无待审核草稿。
          </div>
        ) : (
          drafts.map((draft) => {
            const isOpen = openId === draft.id;
            const isCurrentPending = isPending && pendingId === draft.id;

            return (
              <article key={draft.id} className="space-y-3 rounded-2xl border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="min-w-0 max-w-full break-words text-sm font-medium">
                        {draft.title}
                      </h3>
                      {draft.contentType ? <Badge variant="secondary">{draft.contentType}</Badge> : null}
                    </div>
                    <p className="break-words text-muted-foreground">
                      {draft.categoryPath.length > 0 ? draft.categoryPath.join(" / ") : "未指定分类"}
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(draft.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenId(isOpen ? null : draft.id)}
                    >
                      {isOpen ? "收起" : "预览"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => accept(draft.id)}
                      disabled={isCurrentPending}
                    >
                      接受入库
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => reject(draft.id)}
                      disabled={isCurrentPending}
                    >
                      拒绝
                    </Button>
                  </div>
                </div>
                {isOpen ? <DraftPreview contentJson={draft.contentJson} /> : null}
              </article>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
