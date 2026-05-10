"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addMaterialVariant, deleteMaterialVariant } from "./actions";
import type { MaterialVariantInfo } from "./types";

type MaterialVariantListProps = {
  materialId: string;
  variants: MaterialVariantInfo[];
};

export function MaterialVariantList({ materialId, variants }: MaterialVariantListProps) {
  const router = useRouter();
  const [type, setType] = useState("natural");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await addMaterialVariant(materialId, { type, text, note });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setType("natural");
    setText("");
    setNote("");
    router.refresh();
  }

  async function handleDelete(variantId: string) {
    const confirmed = window.confirm("确定删除这条替代表达吗？");
    if (!confirmed) return;

    const result = await deleteMaterialVariant(variantId);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>替代表达</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {variants.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            暂无替代表达。可以添加更自然、更正式或更口语的版本。
          </div>
        ) : (
          <div className="space-y-3">
            {variants.map((variant) => (
              <div key={variant.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="secondary">{variant.type}</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(variant.id)}
                  >
                    删除
                  </Button>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{variant.text}</p>
                {variant.note ? (
                  <p className="mt-2 text-sm text-muted-foreground">{variant.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <form className="space-y-3 rounded-lg border p-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-[160px_1fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="variant-type">
                类型
              </label>
              <Input
                id="variant-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
                placeholder="natural"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="variant-note">
                备注，可选
              </label>
              <Input
                id="variant-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="例如：更适合面试回答"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="variant-text">
              表达内容
            </label>
            <Textarea
              id="variant-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="输入替代表达。"
              rows={3}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "添加中..." : "添加替代表达"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
