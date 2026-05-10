"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { deleteFavoriteAction } from "@/features/favorites/actions";
import { FavoriteFormDialog } from "@/features/favorites/favorite-form-dialog";
import type { FavoriteInfo } from "@/features/favorites/types";

import { reviewFavoriteAction } from "./actions";
import type { ReviewFavorite, ReviewResult } from "./types";
import {
  formatReviewDate,
  getFavoriteTypeLabel,
  getReviewResultLabel,
} from "./review-utils";

type ReviewCardProps = {
  favorite: ReviewFavorite;
  mode?: "review" | "readonly";
  onReviewed?: (result: ReviewResult) => void;
  showActions?: boolean;
};

function toFavoriteInfo(favorite: ReviewFavorite): FavoriteInfo {
  return {
    id: favorite.id,
    materialId: favorite.materialId,
    text: favorite.text,
    type: favorite.type as FavoriteInfo["type"],
    meaning: favorite.meaning,
    note: favorite.note,
    sourceSentence: favorite.sourceSentence,
    reviewStage: favorite.reviewStage,
    mastery: favorite.mastery,
    nextReviewAt: favorite.nextReviewAt,
    lastReviewAt: favorite.lastReviewAt,
    createdAt: favorite.createdAt,
    updatedAt: favorite.updatedAt,
    material: favorite.material
      ? { id: favorite.material.id, title: favorite.material.title }
      : null,
  };
}

export function ReviewCard({
  favorite,
  mode = "review",
  onReviewed,
  showActions = false,
}: ReviewCardProps) {
  const router = useRouter();
  const [showMeaning, setShowMeaning] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleReview(result: ReviewResult) {
    startTransition(async () => {
      const response = await reviewFavoriteAction({
        favoriteId: favorite.id,
        result,
      });

      if (response.ok) {
        toast.success(response.message);
        onReviewed?.(result);
      } else {
        toast.error(response.message);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const response = await deleteFavoriteAction(favorite.id);

      if (response.ok) {
        toast.success(response.message);
        router.refresh();
      } else {
        toast.error(response.message);
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="secondary" className="shrink-0">{getFavoriteTypeLabel(favorite.type)}</Badge>
          <Badge variant="outline" className="shrink-0">阶段 {favorite.reviewStage}</Badge>
          <span className="min-w-0 break-words text-xs text-muted-foreground">
            下次复习：{formatReviewDate(favorite.nextReviewAt)}
          </span>
        </div>

        <CardTitle className="line-clamp-3 min-w-0 break-words text-lg leading-relaxed sm:text-xl">{favorite.text}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={showActions ? "min-h-10 flex-1 basis-24 px-3 sm:min-h-9 sm:flex-none" : "min-h-10 w-full sm:min-h-9 sm:w-auto"}
              onClick={() => setShowMeaning((value) => !value)}
            >
              {showMeaning ? "隐藏释义" : "显示释义"}
            </Button>
            {showMeaning && favorite.material && !showActions ? (
              <Button asChild variant="ghost" size="sm" className="min-h-10 w-full sm:min-h-9 sm:w-auto">
                <Link href={`/library/material/${favorite.material.id}`}>查看来源语料</Link>
              </Button>
            ) : null}
            {showActions && !confirmingDelete ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-10 flex-1 basis-20 px-3 sm:min-h-9 sm:flex-none"
                  onClick={() => setEditOpen(true)}
                >
                  编辑
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="min-h-10 flex-1 basis-20 px-3 sm:min-h-9 sm:flex-none"
                  onClick={() => setConfirmingDelete(true)}
                >
                  删除
                </Button>
              </>
            ) : null}
          </div>

          {showMeaning ? (
            <div className="rounded-xl bg-muted p-3 text-sm leading-7 break-words">
              {favorite.meaning || "暂无释义。"}
            </div>
          ) : null}
        </div>

        {showMeaning && favorite.sourceSentence ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">来源句子</p>
            <p className="rounded-xl border p-3 text-sm leading-7 break-words">
              {favorite.sourceSentence}
            </p>
          </div>
        ) : null}

        {showMeaning && favorite.note ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">备注</p>
            <p className="break-words text-sm leading-7 text-muted-foreground">{favorite.note}</p>
          </div>
        ) : null}

        {showMeaning && favorite.material ? (
          <div className="min-w-0 space-y-1 text-xs text-muted-foreground">
            <p className="break-words">来源语料：{favorite.material.title}</p>
            {favorite.material.category ? <p className="break-words">所属分类：{favorite.material.category.name}</p> : null}
          </div>
        ) : null}

        {mode === "review" ? (
          <>
            <Separator />
            <div className="grid gap-2 sm:grid-cols-3">
              {(["known", "unclear", "unknown"] as ReviewResult[]).map((result) => (
                <Button
                  key={result}
                  type="button"
                  variant={result === "known" ? "default" : "outline"}
                  className="min-h-10"
                  disabled={isPending}
                  onClick={() => handleReview(result)}
                >
                  {getReviewResultLabel(result)}
                </Button>
              ))}
            </div>
          </>
        ) : null}

        {showActions && confirmingDelete ? (
          <>
            <Separator />
            <div className="space-y-3 rounded-xl border border-destructive/50 p-4">
              <p className="text-sm font-medium">确认删除这个收藏？</p>
              <p className="text-sm text-muted-foreground">
                删除后不会影响原语料，只会从收藏和复习列表中移除。
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="min-h-10 w-full sm:min-h-9 sm:w-auto"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  {isPending ? "删除中..." : "确认删除"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-10 w-full sm:min-h-9 sm:w-auto"
                  disabled={isPending}
                  onClick={() => setConfirmingDelete(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {showActions ? (
          <FavoriteFormDialog
            mode="edit"
            favorite={toFavoriteInfo(favorite)}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
