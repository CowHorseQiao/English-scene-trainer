"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MaterialListItem } from "./types";

const CONTENT_TYPE_BADGES: Record<string, string> = {
  monologue: "独白",
  dialogue: "对话",
  article: "短文",
  interview: "访谈",
  ielts: "雅思",
};

type MaterialCardProps = {
  material: MaterialListItem;
};

export function MaterialCard({ material }: MaterialCardProps) {
  const typeLabel = CONTENT_TYPE_BADGES[material.contentType];

  return (
    <Card className="min-w-0">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <CardTitle className="line-clamp-2 min-w-0 flex-1 break-words text-base">{material.title}</CardTitle>
          <Badge variant="outline" className="shrink-0">难度 {material.difficulty}</Badge>
        </div>

        <div className="flex min-w-0 flex-wrap gap-1">
          {typeLabel ? <Badge className="max-w-full break-words">{typeLabel}</Badge> : null}
          {material.scene ? <Badge variant="secondary" className="max-w-full break-words">{material.scene}</Badge> : null}
          {material.level ? <Badge variant="secondary" className="max-w-full break-words">{material.level}</Badge> : null}
          {material.variantsCount > 0 ? (
            <Badge variant="secondary" className="shrink-0">替代表达 {material.variantsCount}</Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <p className="line-clamp-3 break-words text-sm leading-6">{material.en}</p>
          <p className="line-clamp-2 break-words text-sm text-muted-foreground">{material.zh}</p>
        </div>

        {material.tags.length > 0 ? (
          <div className="flex min-w-0 flex-wrap gap-1">
            {material.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="max-w-full break-words text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/library/material/${material.id}`}>查看详情</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
