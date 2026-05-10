"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaterialFeedCard } from "./material-feed-card";
import type { MaterialFeedResult } from "./home-queries";

const SENTINEL_ALL = "__all";

const CONTENT_TYPE_OPTIONS = [
  { value: SENTINEL_ALL, label: "全部类型" },
  { value: "sentence", label: "句子" },
  { value: "monologue", label: "独白" },
  { value: "dialogue", label: "对话" },
  { value: "article", label: "短文" },
  { value: "interview", label: "访谈" },
  { value: "ielts", label: "雅思" },
];

type MaterialFeedProps = {
  data: MaterialFeedResult;
  categories: Array<{ id: string; name: string }>;
  currentSort: string;
  currentContentType: string;
  currentCategoryId: string;
};

function buildUrl(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value !== SENTINEL_ALL) searchParams.set(key, value);
  }
  const qs = searchParams.toString();
  return qs ? `/?${qs}` : "/";
}

export function MaterialFeed({
  data,
  categories,
  currentSort,
  currentContentType,
  currentCategoryId,
}: MaterialFeedProps) {
  const router = useRouter();
  const { materials, total, page, totalPages } = data;

  const navigate = useCallback(
    (updates: Record<string, string | undefined>) => {
      const base: Record<string, string | undefined> = {
        sort: currentSort !== "createdAt" ? currentSort : undefined,
        contentType: currentContentType || undefined,
        categoryId: currentCategoryId || undefined,
      };
      router.push(buildUrl({ ...base, ...updates }));
    },
    [currentSort, currentContentType, currentCategoryId, router],
  );

  const contentTypeValue = currentContentType || SENTINEL_ALL;
  const categoryIdValue = currentCategoryId || SENTINEL_ALL;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-muted/20 p-2 shadow-sm sm:gap-3">
        <Select
          value={currentSort}
          onValueChange={(value) => navigate({ sort: value, page: undefined })}
        >
          <SelectTrigger className="h-10 min-w-[7.75rem] flex-1 rounded-xl bg-background px-3 sm:h-9 sm:max-w-36 sm:flex-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">最新添加</SelectItem>
            <SelectItem value="updatedAt">最近更新</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={contentTypeValue}
          onValueChange={(value) => navigate({ contentType: value, page: undefined })}
        >
          <SelectTrigger className="h-10 min-w-[7.25rem] flex-1 rounded-xl bg-background px-3 sm:h-9 sm:max-w-32 sm:flex-none">
            <SelectValue placeholder="类型" />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryIdValue}
          onValueChange={(value) => navigate({ categoryId: value, page: undefined })}
        >
          <SelectTrigger className="h-10 min-w-[8rem] flex-1 rounded-xl bg-background px-3 sm:h-9 sm:max-w-44 sm:flex-none">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SENTINEL_ALL}>全部分类</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="ml-auto h-8 rounded-full px-3">
          共 {total} 条
        </Badge>
      </div>

      {materials.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">还没有语料。去添加一篇吧。</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <MaterialFeedCard key={material.id} material={material} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {page > 1 ? (
            <Link
              href={buildUrl({
                sort: currentSort !== "createdAt" ? currentSort : undefined,
                contentType: currentContentType || undefined,
                categoryId: currentCategoryId || undefined,
                page: page > 2 ? String(page - 1) : undefined,
              })}
              className="flex min-h-11 items-center rounded-xl border px-4 py-3 text-sm transition-colors hover:bg-muted sm:px-3 sm:py-2"
            >
              上一页
            </Link>
          ) : null}

          <span className="text-sm text-muted-foreground px-2">
            {page} / {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={buildUrl({
                sort: currentSort !== "createdAt" ? currentSort : undefined,
                contentType: currentContentType || undefined,
                categoryId: currentCategoryId || undefined,
                page: String(page + 1),
              })}
              className="rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              下一页
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
