"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryTreeNode } from "@/features/categories/types";
import { listMaterialsByCategoryAction } from "./actions";
import { MaterialCard } from "./material-card";
import { MaterialFormDialog } from "./material-form-dialog";
import type { MaterialListItem } from "./types";

type CategoryMaterialsPanelProps = {
  category: CategoryTreeNode;
};

export function CategoryMaterialsPanel({ category }: CategoryMaterialsPanelProps) {
  const [materials, setMaterials] = useState<MaterialListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listMaterialsByCategoryAction(category.id);
      setMaterials(result);
    } catch (loadError) {
      console.error(loadError);
      setError("语料列表加载失败，请查看终端日志。");
    } finally {
      setLoading(false);
    }
  }, [category.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMaterials();
  }, [loadMaterials]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>当前分类语料</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              当前分类下的语料。
            </p>
          </div>

          <MaterialFormDialog
            mode="create"
            categoryId={category.id}
            trigger={<Button>新建语料</Button>}
            onSuccess={() => {
              void loadMaterials();
            }}
          />
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            正在加载语料…
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!loading && !error && materials.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">当前分类下还没有语料。</p>
            <div className="mt-4">
              <MaterialFormDialog
                mode="create"
                categoryId={category.id}
                trigger={<Button variant="secondary">创建第一条语料</Button>}
                onSuccess={() => {
                  void loadMaterials();
                }}
              />
            </div>
          </div>
        ) : null}

        {materials.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
