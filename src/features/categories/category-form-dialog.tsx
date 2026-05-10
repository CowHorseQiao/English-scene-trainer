"use client";

import { FormEvent, ReactNode, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCategory, updateCategory } from "./actions";
import type { CategoryFlatNode } from "./types";

type CategoryFormDialogProps = {
  mode: "create" | "edit";
  trigger: ReactNode;
  parentId?: string | null;
  category?: CategoryFlatNode;
  onSuccess?: (categoryId?: string) => void;
};

export function CategoryFormDialog({
  mode,
  trigger,
  parentId = null,
  category,
  onSuccess,
}: CategoryFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (newOpen) {
      setName(category?.name ?? "");
      setDescription(category?.description ?? "");
      setError(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result =
      mode === "create"
        ? await createCategory({ name, description, parentId })
        : category
          ? await updateCategory(category.id, { name, description })
          : { ok: false, message: "缺少需要编辑的分类。" };

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setOpen(false);
    onSuccess?.(result.categoryId);
    router.refresh();
  }

  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? "新建分类" : "重命名分类"}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "创建一个新的英语学习场景分类。"
              : "修改当前分类的名称和描述。"}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="category-name">
              分类名称
            </label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：保研英语"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="category-description">
              分类描述，可选
            </label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="简单说明这个分类用于存放什么语料。"
              rows={3}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
