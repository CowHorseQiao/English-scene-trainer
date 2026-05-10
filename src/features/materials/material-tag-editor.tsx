"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addMaterialTag, deleteMaterialTag } from "./actions";
import type { MaterialTagInfo } from "./types";

type MaterialTagEditorProps = {
  materialId: string;
  tags: MaterialTagInfo[];
};

export function MaterialTagEditor({ materialId, tags }: MaterialTagEditorProps) {
  const router = useRouter();
  const [tagName, setTagName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await addMaterialTag(materialId, tagName);

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setTagName("");
    router.refresh();
  }

  async function handleDelete(tagId: string) {
    const result = await deleteMaterialTag(materialId, tagId);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <span className="text-sm text-muted-foreground">暂无标签。</span>
        ) : (
          tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1 pr-1">
              {tag.name}
              <button
                type="button"
                className="ml-1 rounded px-1 text-xs hover:bg-background/80"
                onClick={() => handleDelete(tag.tagId)}
                aria-label={`删除标签 ${tag.name}`}
              >
                ×
              </button>
            </Badge>
          ))
        )}
      </div>

      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input
          value={tagName}
          onChange={(event) => setTagName(event.target.value)}
          placeholder="添加标签，例如：项目经历"
        />
        <Button type="submit" disabled={submitting}>
          添加
        </Button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
