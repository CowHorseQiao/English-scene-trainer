"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { deleteFavoriteAction } from "./actions";
import { FavoriteFormDialog } from "./favorite-form-dialog";
import type { FavoriteInfo } from "./types";
import { getFavoriteTypeLabel } from "./types";

type FavoriteCardProps = {
  favorite: FavoriteInfo;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function FavoriteCard({ favorite }: FavoriteCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(`确定删除收藏「${favorite.text}」吗？`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteFavoriteAction(favorite.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <CardTitle className="line-clamp-2 min-w-0 break-words text-base leading-7">{favorite.text}</CardTitle>
            <div className="flex min-w-0 flex-wrap gap-2">
              <Badge variant="secondary" className="shrink-0">{getFavoriteTypeLabel(favorite.type)}</Badge>
              <Badge variant="outline" className="shrink-0">复习阶段 {favorite.reviewStage}</Badge>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <FavoriteFormDialog
              mode="edit"
              favorite={favorite}
              trigger={<Button type="button" variant="outline" size="sm">编辑</Button>}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDelete}
            >
              删除
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {favorite.meaning ? (
          <div>
            <p className="text-muted-foreground">中文意思</p>
            <p className="mt-1 break-words leading-7">{favorite.meaning}</p>
          </div>
        ) : null}

        {favorite.note ? (
          <div>
            <p className="text-muted-foreground">备注</p>
            <p className="mt-1 whitespace-pre-wrap break-words leading-7">{favorite.note}</p>
          </div>
        ) : null}

        {favorite.sourceSentence ? (
          <div>
            <p className="text-muted-foreground">来源句子</p>
            <p className="mt-1 whitespace-pre-wrap break-words rounded-md bg-muted p-3 leading-7">
              {favorite.sourceSentence}
            </p>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="shrink-0">下次复习：{formatDateTime(favorite.nextReviewAt)}</span>
          <span className="shrink-0">创建：{formatDateTime(favorite.createdAt)}</span>
          {favorite.material ? (
            <Link
              href={`/library/material/${favorite.material.id}`}
              className="min-w-0 max-w-full break-words underline underline-offset-4"
            >
              来源语料：{favorite.material.title}
            </Link>
          ) : (
            <span>无来源语料</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
