"use client";

import { ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CategoryTreeNode } from "@/features/categories/types";
import { flattenCategoryTree } from "@/features/categories/utils";
import { moveMaterial } from "./actions";

type MoveMaterialDialogProps = {
  materialId: string;
  currentCategoryId: string;
  categories: CategoryTreeNode[];
  trigger: ReactNode;
  onSuccess?: () => void;
};

export function MoveMaterialDialog({
  materialId,
  currentCategoryId,
  categories,
  trigger,
  onSuccess,
}: MoveMaterialDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(currentCategoryId);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const options = useMemo(() => flattenCategoryTree(categories), [categories]);

  async function handleMove() {
    setError(null);
    setSubmitting(true);

    const result = await moveMaterial({ materialId, categoryId });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setOpen(false);
    onSuccess?.();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>移动语料</DialogTitle>
          <DialogDescription>选择一个新的分类来存放这条语料。</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="move-material-category">
            目标分类
          </label>
          <select
            id="move-material-category"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {options.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button type="button" onClick={handleMove} disabled={submitting || categoryId === currentCategoryId}>
            {submitting ? "移动中..." : "确认移动"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
