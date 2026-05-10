"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createFavoriteAction, updateFavoriteAction } from "./actions";
import type { FavoriteInfo, FavoriteType } from "./types";
import { favoriteTypeOptions } from "./types";

type FavoriteFormValues = {
  materialId?: string | null;
  text: string;
  type: FavoriteType;
  meaning: string;
  note: string;
  sourceSentence: string;
};

type FavoriteFormDialogProps = {
  mode?: "create" | "edit";
  favorite?: FavoriteInfo;
  initialValues?: Partial<FavoriteFormValues>;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function buildInitialValues(
  favorite?: FavoriteInfo,
  initialValues?: Partial<FavoriteFormValues>,
): FavoriteFormValues {
  if (favorite) {
    return {
      materialId: favorite.materialId,
      text: favorite.text,
      type: favorite.type,
      meaning: favorite.meaning ?? "",
      note: favorite.note ?? "",
      sourceSentence: favorite.sourceSentence ?? "",
    };
  }

  return {
    materialId: initialValues?.materialId ?? null,
    text: initialValues?.text ?? "",
    type: initialValues?.type ?? "phrase",
    meaning: initialValues?.meaning ?? "",
    note: initialValues?.note ?? "",
    sourceSentence: initialValues?.sourceSentence ?? "",
  };
}

export function FavoriteFormDialog({
  mode = "create",
  favorite,
  initialValues,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: FavoriteFormDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [form, setForm] = useState<FavoriteFormValues>(() =>
    buildInitialValues(favorite, initialValues),
  );
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      setForm(buildInitialValues(favorite, initialValues));
    }
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  }

  function updateField<K extends keyof FavoriteFormValues>(key: K, value: FavoriteFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    startTransition(async () => {
      const payload = {
        materialId: form.materialId || null,
        text: form.text,
        type: form.type,
        meaning: form.meaning,
        note: form.note,
        sourceSentence: form.sourceSentence,
      };

      const result =
        mode === "edit" && favorite
          ? await updateFavoriteAction(favorite.id, payload)
          : await createFavoriteAction(payload);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined ? (
        <DialogTrigger asChild>
          {trigger ?? <Button variant="outline">收藏表达</Button>}
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "编辑收藏" : "收藏表达"}</DialogTitle>
          <DialogDescription>
            第一版先用手动表单收藏，不做复杂划词弹窗。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="favorite-text">
              收藏内容 <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="favorite-text"
              value={form.text}
              onChange={(event) => updateField("text", event.target.value)}
              placeholder="例如：be responsible for / What I found most challenging was..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">类型</label>
              <Select
                value={form.type}
                onValueChange={(value) => updateField("type", value as FavoriteType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {favoriteTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="favorite-meaning">
                中文意思
              </label>
              <Input
                id="favorite-meaning"
                value={form.meaning}
                onChange={(event) => updateField("meaning", event.target.value)}
                placeholder="用于介绍自己负责的工作"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="favorite-note">
              备注
            </label>
            <Textarea
              id="favorite-note"
              value={form.note}
              onChange={(event) => updateField("note", event.target.value)}
              placeholder="可以写使用场景、易错点、自己的理解"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="favorite-source-sentence">
              来源句子
            </label>
            <Textarea
              id="favorite-source-sentence"
              value={form.sourceSentence}
              onChange={(event) => updateField("sourceSentence", event.target.value)}
              placeholder="系统会尽量自动填入来源句子，也可以手动修改"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button type="button" disabled={isPending} onClick={handleSubmit}>
            {isPending ? "保存中..." : mode === "edit" ? "保存修改" : "确认收藏"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
