"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ReviewCard } from "./review-card";
import type { ReviewFavorite, ReviewResult } from "./types";

type DueReviewSessionProps = {
  items: ReviewFavorite[];
};

export function DueReviewSession({ items }: DueReviewSessionProps) {
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ known: 0, unclear: 0, unknown: 0 });

  const current = useMemo(
    () => items.find((item) => !reviewedIds.has(item.id)) ?? null,
    [items, reviewedIds],
  );

  const reviewedCount = useMemo(() => {
    const count = items.filter((item) => reviewedIds.has(item.id)).length;
    return count;
  }, [items, reviewedIds]);

  const handleReviewed = useCallback(
    (result: ReviewResult) => {
      if (!current) return;

      setStats((prev) => {
        const next = { ...prev };
        if (result === "known") next.known += 1;
        else if (result === "unclear") next.unclear += 1;
        else next.unknown += 1;
        return next;
      });

      setReviewedIds((prev) => {
        const next = new Set(prev);
        next.add(current.id);
        return next;
      });
    },
    [current],
  );

  if (items.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>今日应复习 0</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="font-medium">今日没有待复习内容。</p>
            <p className="mt-2 text-sm text-muted-foreground">
              新收藏会进入今日复习。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>今日复习完成</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl border p-4">
              <p className="text-2xl font-semibold text-green-600">{stats.known}</p>
              <p className="text-sm text-muted-foreground">认识</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-2xl font-semibold text-amber-600">{stats.unclear}</p>
              <p className="text-sm text-muted-foreground">模糊</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-2xl font-semibold text-red-600">{stats.unknown}</p>
              <p className="text-sm text-muted-foreground">不认识</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            本轮共复习 {items.length} 项。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/library">返回场景库</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          今日应复习 {items.length}
        </h2>
        <span className="text-sm text-muted-foreground">
          第 {reviewedCount + 1} / {items.length} 题
        </span>
      </div>

      <ReviewCard
        key={current.id}
        favorite={current}
        mode="review"
        onReviewed={handleReviewed}
      />
    </div>
  );
}
