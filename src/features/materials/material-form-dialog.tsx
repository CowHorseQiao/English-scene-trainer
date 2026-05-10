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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createMaterial, updateMaterial } from "./actions";
import type { MaterialDetail, MaterialListItem, SegmentInput } from "./types";

const CONTENT_TYPES = [
  { value: "sentence", label: "单句" },
  { value: "monologue", label: "独白/自述" },
  { value: "dialogue", label: "对话" },
  { value: "article", label: "短文" },
  { value: "interview", label: "访谈" },
  { value: "ielts", label: "雅思语料" },
] as const;

const SEGMENT_TYPES = [
  { value: "paragraph", label: "段落" },
  { value: "line", label: "对话行" },
  { value: "qa", label: "问答" },
] as const;

function emptySegment(order: number): SegmentInput {
  return { order, segmentType: "paragraph", en: "", zh: "", speaker: "", note: "" };
}

type MaterialFormDialogProps = {
  mode: "create" | "edit";
  trigger: ReactNode;
  categoryId: string;
  material?: MaterialDetail | MaterialListItem;
  onSuccess?: (materialId?: string) => void;
};

export function MaterialFormDialog({
  mode,
  trigger,
  categoryId,
  material,
  onSuccess,
}: MaterialFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(material?.title ?? "");
  const [contentType, setContentType] = useState("sentence");
  const [zh, setZh] = useState(material?.zh ?? "");
  const [en, setEn] = useState(material?.en ?? "");
  const [scene, setScene] = useState(material?.scene ?? "");
  const [level, setLevel] = useState(material?.level ?? "");
  const [usage, setUsage] = useState(material?.usage ?? "");
  const [note, setNote] = useState(material?.note ?? "");
  const [difficulty, setDifficulty] = useState(String(material?.difficulty ?? 1));
  const [segments, setSegments] = useState<SegmentInput[]>([emptySegment(0)]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isDetail = (m: unknown): m is MaterialDetail =>
    !!m && typeof m === "object" && "segments" in m;

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) return;
    setTitle(material?.title ?? "");
    setZh(material?.zh ?? "");
    setEn(material?.en ?? "");
    setScene(material?.scene ?? "");
    setLevel(material?.level ?? "");
    setUsage(material?.usage ?? "");
    setNote(material?.note ?? "");
    setDifficulty(String(material?.difficulty ?? 1));
    setError(null);

    if (material && "contentType" in material) {
      setContentType(material.contentType);
    } else {
      setContentType("sentence");
    }

    if (isDetail(material) && material.segments.length > 0) {
      setSegments(
        material.segments.map((seg) => ({
          order: seg.order,
          segmentType: seg.segmentType,
          en: seg.en,
          zh: seg.zh,
          speaker: seg.speaker ?? "",
          note: seg.note ?? "",
        })),
      );
    } else {
      setSegments([emptySegment(0)]);
    }
  }

  function addSegment() {
    setSegments((prev) => [...prev, emptySegment(prev.length)]);
  }

  function removeSegment(index: number) {
    setSegments((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      return next.map((seg, i) => ({ ...seg, order: i }));
    });
  }

  function updateSegment(index: number, patch: Partial<SegmentInput>) {
    setSegments((prev) =>
      prev.map((seg, i) => (i === index ? { ...seg, ...patch } : seg)),
    );
  }

  const isSentence = contentType === "sentence";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      categoryId,
      title,
      zh: isSentence ? zh : "",
      en: isSentence ? en : "",
      contentType,
      scene,
      level,
      usage,
      note,
      difficulty: Number(difficulty),
      segments: isSentence ? undefined : segments,
    };

    const result =
      mode === "create"
        ? await createMaterial(payload)
        : material
          ? await updateMaterial(material.id, payload)
          : { ok: false, message: "缺少需要编辑的语料。" };

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setOpen(false);
    onSuccess?.(result.materialId);
    router.refresh();
  }

  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isCreate ? "新建语料" : "编辑语料"}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "在当前分类下创建一条新的英语场景语料。"
              : "修改语料的核心中文、英文和说明信息。"}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="material-title">
              标题
            </label>
            <Input
              id="material-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：介绍项目分工"
              autoFocus
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">语料类型</label>
              <Select value={contentType} onValueChange={(v) => setContentType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="material-difficulty">
                难度，1-5
              </label>
              <Input
                id="material-difficulty"
                type="number"
                min={1}
                max={5}
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="material-scene">
                场景，可选
              </label>
              <Input
                id="material-scene"
                value={scene ?? ""}
                onChange={(event) => setScene(event.target.value)}
                placeholder="例如：保研英语面试"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="material-level">
                等级，可选
              </label>
              <Input
                id="material-level"
                value={level ?? ""}
                onChange={(event) => setLevel(event.target.value)}
                placeholder="例如：B2 / C1"
              />
            </div>
          </div>

          {isSentence ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="material-zh">
                  中文
                </label>
                <Textarea
                  id="material-zh"
                  value={zh}
                  onChange={(event) => setZh(event.target.value)}
                  placeholder="例如：我主要负责路径规划算法的实现和可视化。"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="material-en">
                  英文
                </label>
                <Textarea
                  id="material-en"
                  value={en}
                  onChange={(event) => setEn(event.target.value)}
                  placeholder="例如：I was mainly responsible for implementing and visualizing the path planning algorithm."
                  rows={4}
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  段落 / 对话行（共 {segments.length} 段）
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addSegment}>
                  添加段落
                </Button>
              </div>

              <div className="space-y-3">
                {segments.map((seg, index) => (
                  <div
                    key={index}
                    className="rounded-lg border p-3 space-y-2 bg-muted/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        第 {index + 1} 段
                      </span>
                      {segments.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-destructive"
                          onClick={() => removeSegment(index)}
                        >
                          删除
                        </Button>
                      ) : null}
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                      <div>
                        <label className="text-xs text-muted-foreground">类型</label>
                        <Select
                          value={seg.segmentType ?? "paragraph"}
                          onValueChange={(v) =>
                            updateSegment(index, { segmentType: v })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SEGMENT_TYPES.map((st) => (
                              <SelectItem key={st.value} value={st.value}>
                                {st.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">
                          说话人，可选
                        </label>
                        <Input
                          className="h-8 text-xs"
                          value={seg.speaker ?? ""}
                          onChange={(event) =>
                            updateSegment(index, { speaker: event.target.value })
                          }
                          placeholder="例如：面试官"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">
                          备注，可选
                        </label>
                        <Input
                          className="h-8 text-xs"
                          value={seg.note ?? ""}
                          onChange={(event) =>
                            updateSegment(index, { note: event.target.value })
                          }
                          placeholder="语法说明等"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">英文</label>
                      <Textarea
                        className="mt-1 text-sm"
                        rows={2}
                        value={seg.en}
                        onChange={(event) =>
                          updateSegment(index, { en: event.target.value })
                        }
                        placeholder="English content..."
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">中文</label>
                      <Textarea
                        className="mt-1 text-sm"
                        rows={2}
                        value={seg.zh}
                        onChange={(event) =>
                          updateSegment(index, { zh: event.target.value })
                        }
                        placeholder="中文内容..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="material-usage">
              使用说明，可选
            </label>
            <Textarea
              id="material-usage"
              value={usage ?? ""}
              onChange={(event) => setUsage(event.target.value)}
              placeholder="说明这句话适合在什么场景使用。"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="material-note">
              备注，可选
            </label>
            <Textarea
              id="material-note"
              value={note ?? ""}
              onChange={(event) => setNote(event.target.value)}
              placeholder="例如：responsible for doing sth 是固定搭配。"
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
