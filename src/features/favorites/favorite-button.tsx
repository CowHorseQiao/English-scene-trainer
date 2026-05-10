"use client";

import { Button } from "@/components/ui/button";

import { FavoriteFormDialog } from "./favorite-form-dialog";
import type { FavoriteType } from "./types";

type FavoriteButtonProps = {
  materialId?: string | null;
  defaultText?: string;
  defaultType?: FavoriteType;
  defaultMeaning?: string;
  defaultNote?: string;
  sourceSentence?: string;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost";
};

export function FavoriteButton({
  materialId,
  defaultText = "",
  defaultType = "phrase",
  defaultMeaning = "",
  defaultNote = "",
  sourceSentence = "",
  label = "收藏表达",
  size = "sm",
  variant = "outline",
}: FavoriteButtonProps) {
  return (
    <FavoriteFormDialog
      initialValues={{
        materialId,
        text: defaultText,
        type: defaultType,
        meaning: defaultMeaning,
        note: defaultNote,
        sourceSentence,
      }}
      trigger={
        <Button type="button" size={size} variant={variant}>
          {label}
        </Button>
      }
    />
  );
}
