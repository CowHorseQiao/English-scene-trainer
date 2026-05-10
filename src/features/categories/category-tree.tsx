"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CategoryMaterialsPanel } from "@/features/materials/category-materials-panel";
import { CategoryFormDialog } from "./category-form-dialog";
import { CategoryTreeNodeView } from "./category-tree-node";
import type { CategoryTreeNode } from "./types";
import {
  countDescendants,
  findCategoryById,
  getCategoryPath,
  getFirstCategoryId,
} from "./utils";

type CategoryTreeProps = {
  categories: CategoryTreeNode[];
  initialCategoryId?: string;
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

export function CategoryTree({ categories, initialCategoryId }: CategoryTreeProps) {
  const firstCategoryId = useMemo(() => getFirstCategoryId(categories), [categories]);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => {
      if (initialCategoryId) {
        const found = findCategoryById(categories, initialCategoryId);
        if (found) return found.id;
      }
      return firstCategoryId;
    },
  );
  const [showTreeOnMobile, setShowTreeOnMobile] = useState(false);

  const selectedCategory = useMemo(
    () => findCategoryById(categories, selectedId) ?? findCategoryById(categories, firstCategoryId),
    [categories, firstCategoryId, selectedId],
  );

  const selectedPath = useMemo(
    () => getCategoryPath(categories, selectedCategory?.id),
    [categories, selectedCategory?.id],
  );

  function handleTreeSelect(id: string) {
    setSelectedId(id);
    setShowTreeOnMobile(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className={`min-h-[520px] rounded-2xl ${showTreeOnMobile ? "" : "hidden"} lg:block`}>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">分类树</CardTitle>
            <CategoryFormDialog
              mode="create"
              trigger={<Button size="sm">新建根分类</Button>}
              onSuccess={(categoryId) => {
                if (categoryId) setSelectedId(categoryId);
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            用分类组织不同场景的语料。
          </p>
        </CardHeader>

        <CardContent>
          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">还没有分类。</p>
              <div className="mt-4">
                <CategoryFormDialog
                  mode="create"
                  trigger={<Button>创建第一个分类</Button>}
                  onSuccess={(categoryId) => {
                    if (categoryId) setSelectedId(categoryId);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {categories.map((node) => (
                <CategoryTreeNodeView
                  key={node.id}
                  node={node}
                  selectedId={selectedCategory?.id ?? null}
                  onSelect={handleTreeSelect}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTreeOnMobile((v) => !v)}
          >
            {showTreeOnMobile ? "收起分类" : "选择分类"}
          </Button>
          {selectedCategory ? (
            <span className="text-sm text-muted-foreground">
              当前：{selectedCategory.name}
            </span>
          ) : null}
        </div>
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-xl">
                  {selectedCategory ? selectedCategory.name : "请选择分类"}
                </CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedCategory
                    ? selectedCategory.description || "暂无分类描述。"
                    : "左侧创建或选择一个分类后，这里会显示分类详情。"}
                </p>
              </div>

              {selectedCategory ? (
                <div className="flex flex-wrap gap-2">
                  <CategoryFormDialog
                    mode="create"
                    parentId={selectedCategory.id}
                    trigger={<Button variant="secondary">新建子分类</Button>}
                  />
                  <CategoryFormDialog
                    mode="edit"
                    category={selectedCategory}
                    trigger={<Button variant="outline">重命名</Button>}
                  />
                </div>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {selectedCategory ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">直接子分类：{selectedCategory.childrenCount}</Badge>
                  <Badge variant="secondary">全部后代分类：{countDescendants(selectedCategory)}</Badge>
                  <Badge variant="secondary">当前语料：{selectedCategory.materialsCount}</Badge>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">分类路径</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPath.map((item) => item.name).join(" / ")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium">父分类</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPath.length > 1 ? selectedPath[selectedPath.length - 2].name : "根分类"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium">创建时间</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(selectedCategory.createdAt)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium">更新时间</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(selectedCategory.updatedAt)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center">
                <p className="text-muted-foreground">暂无分类。请先创建一个根分类。</p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCategory ? <CategoryMaterialsPanel category={selectedCategory} /> : null}
      </div>
    </div>
  );
}
