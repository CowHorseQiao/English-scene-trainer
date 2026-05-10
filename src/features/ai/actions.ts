"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { GeneratePreviewData } from "./types";

type ConfirmResult = {
  ok: boolean;
  message: string;
  materialId?: string;
};

export async function confirmGenerateDraft(
  categoryId: string,
  data: GeneratePreviewData,
): Promise<ConfirmResult> {
  try {
    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return { ok: false, message: "目标分类不存在。" };
    }

    const material = await db.$transaction(async (tx) => {
      const created = await tx.material.create({
        data: {
          categoryId,
          title: data.title.trim(),
          zh: "",
          en: "",
          contentType: data.contentType,
          scene: data.scene?.trim() || null,
          level: data.level?.trim() || null,
          usage: data.usage?.trim() || null,
          note: data.note?.trim() || null,
          difficulty: data.difficulty,
        },
      });

      if (data.segments.length > 0) {
        await tx.materialSegment.createMany({
          data: data.segments.map((seg) => ({
            materialId: created.id,
            order: seg.order,
            segmentType: seg.segmentType,
            zh: seg.zh.trim(),
            en: seg.en.trim(),
            speaker: seg.speaker?.trim() || null,
            note: seg.note?.trim() || null,
          })),
        });
      }

      if (data.tags.length > 0) {
        for (const tagName of data.tags) {
          const name = tagName.trim();
          if (!name) continue;

          const tag = await tx.tag.upsert({
            where: { name },
            create: { name },
            update: {},
          });

          await tx.materialTag.create({
            data: {
              materialId: created.id,
              tagId: tag.id,
            },
          });
        }
      }

      return created;
    });

    revalidatePath("/library");
    revalidatePath("/generate");

    return { ok: true, message: "语料导入成功。", materialId: material.id };
  } catch (error) {
    console.error("confirmGenerateDraft failed", error);
    return { ok: false, message: "写入数据库失败，请查看终端日志。" };
  }
}
