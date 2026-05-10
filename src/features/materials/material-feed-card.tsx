"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MaterialListItem } from "./types";

const CONTENT_TYPE_BADGES: Record<string, string> = {
  monologue: "独白",
  dialogue: "对话",
  article: "短文",
  interview: "访谈",
  ielts: "雅思",
};

type MaterialFeedCardProps = {
  material: MaterialListItem;
};

export function MaterialFeedCard({ material }: MaterialFeedCardProps) {
  const typeLabel = CONTENT_TYPE_BADGES[material.contentType];

  return (
    <Link href={`/read/${material.id}`}>
      <Card className="h-full min-w-0 cursor-pointer rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="space-y-2 pb-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <CardTitle className="line-clamp-2 min-w-0 flex-1 break-words text-base">{material.title}</CardTitle>
            <Badge variant="outline" className="shrink-0 rounded-full">
              难度 {material.difficulty}
            </Badge>
          </div>

          <div className="flex min-w-0 flex-wrap gap-1">
            {typeLabel ? <Badge className="max-w-full rounded-full break-words">{typeLabel}</Badge> : null}
            {material.scene ? <Badge variant="secondary" className="max-w-full rounded-full break-words">{material.scene}</Badge> : null}
            {material.level ? <Badge variant="secondary" className="max-w-full rounded-full break-words">{material.level}</Badge> : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="line-clamp-3 break-words text-sm leading-6 text-muted-foreground">
            {material.en}
          </p>

          {material.tags.length > 0 ? (
            <div className="flex min-w-0 flex-wrap gap-1">
              {material.tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="max-w-full rounded-full break-words text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
