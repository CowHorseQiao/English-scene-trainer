"use client";

import { useMemo, useState } from "react";

import type { ReviewFavorite } from "./types";
import { ReviewCard } from "./review-card";

const FAVORITE_TYPE_OPTIONS = [
  { value: "", label: "全部类型" },
  { value: "word", label: "单词" },
  { value: "phrase", label: "短语" },
  { value: "pattern", label: "句型" },
  { value: "sentence", label: "句子" },
  { value: "custom", label: "自定义" },
];

type ReviewListProps = {
  items: ReviewFavorite[];
  emptyTitle: string;
  emptyDescription?: string;
  mode?: "review" | "readonly";
  showFilters?: boolean;
  showActions?: boolean;
};

export function ReviewList({
  items,
  emptyTitle,
  emptyDescription,
  mode = "review",
  showFilters = false,
  showActions = false,
}: ReviewListProps) {
  const [filterType, setFilterType] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");

  const categories = useMemo(() => {
    if (!showFilters) return [];
    const map = new Map<string, { id: string; name: string }>();
    for (const item of items) {
      const cat = item.material?.category;
      if (cat && !map.has(cat.id)) {
        map.set(cat.id, cat);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [items, showFilters]);

  const filtered = useMemo(() => {
    if (!showFilters) return items;
    let result = items;
    if (filterType) {
      result = result.filter((item) => item.type === filterType);
    }
    if (filterCategoryId) {
      result = result.filter((item) => item.material?.category?.id === filterCategoryId);
    }
    return result;
  }, [items, showFilters, filterType, filterCategoryId]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center">
        <p className="font-medium">{emptyTitle}</p>
        {emptyDescription ? (
          <p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <select
            className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none sm:h-9 sm:w-auto"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {FAVORITE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none sm:h-9 sm:w-auto"
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
          >
            <option value="">全部分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <p className="font-medium">没有匹配的收藏项</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <ReviewCard key={item.id} favorite={item} mode={mode} showActions={showActions} />
          ))}
        </div>
      )}
    </div>
  );
}
