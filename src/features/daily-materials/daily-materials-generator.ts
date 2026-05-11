import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  DailyGenerationOutputSchema,
  DailyMaterialDraftContentSchema,
  formatDailyZodError,
  type DailyMaterialDraftContent,
} from "./schemas";
import {
  getOrCreateDailyGenerationSetting,
  getPauseMessage,
  normalizeOptional,
  normalizeTags,
} from "./daily-materials-utils";
import type { DailyActionResult } from "./types";

const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const DEFAULT_CATEGORY_NAME = "Daily Materials";

type RunDailyGenerationOptions = {
  source: "manual" | "api";
  requireEnabled?: boolean;
};

type LibrarySummary = {
  categories: Array<{ path: string[]; materialCount: number }>;
  contentTypeDistribution: Record<string, number>;
  recentMaterials: Array<{
    title: string;
    contentType: string;
    scene: string | null;
    level: string | null;
    tags: string[];
    categoryPath: string[];
    createdAt: string;
  }>;
};

function buildCategoryPaths(categories: Array<{ id: string; parentId: string | null; name: string }>) {
  const map = new Map(categories.map((category) => [category.id, category]));

  return function getPath(categoryId: string | null): string[] {
    if (!categoryId) return [];

    const path: string[] = [];
    const visited = new Set<string>();
    let current = map.get(categoryId);

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.unshift(current.name);
      current = current.parentId ? map.get(current.parentId) : undefined;
    }

    return path;
  };
}

async function collectLibrarySummary(): Promise<LibrarySummary> {
  const [categories, recentMaterials, groupedTypes] = await Promise.all([
    db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        parentId: true,
        name: true,
        _count: { select: { materials: true } },
      },
    }),
    db.material.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        title: true,
        contentType: true,
        scene: true,
        level: true,
        categoryId: true,
        createdAt: true,
        tags: {
          select: {
            tag: { select: { name: true } },
          },
        },
      },
    }),
    db.material.groupBy({
      by: ["contentType"],
      _count: { contentType: true },
      where: { isArchived: false },
    }),
  ]);

  const getPath = buildCategoryPaths(categories);

  return {
    categories: categories.map((category) => ({
      path: getPath(category.id),
      materialCount: category._count.materials,
    })),
    contentTypeDistribution: Object.fromEntries(
      groupedTypes.map((item) => [item.contentType, item._count.contentType]),
    ),
    recentMaterials: recentMaterials.map((material) => ({
      title: material.title,
      contentType: material.contentType,
      scene: material.scene,
      level: material.level,
      tags: material.tags.map((item) => item.tag.name),
      categoryPath: getPath(material.categoryId),
      createdAt: material.createdAt.toISOString(),
    })),
  };
}

function buildDailyPrompt(input: {
  setting: Awaited<ReturnType<typeof getOrCreateDailyGenerationSetting>>;
  summary: LibrarySummary;
}) {
  const { setting, summary } = input;

  return `你是一个英语学习语料策划和写作助手。请根据现有语料库概况，生成今天的语料计划和草稿。

要求：
- 输出必须是 JSON object，不要输出 Markdown。
- 不要重复 recentMaterials 中已有标题。
- 语料适合英语学习，中短篇，有明确场景和学习价值。
- dialogue / interview 每个 segment 必须带 speaker，speaker 只能是 Tim、Dacey、Stokie、Tina。
- 不要生成过短碎片句。
- categoryPath 必须是字符串数组。优先使用已有分类路径，也可以建议新路径。
- materials 数量尽量等于 totalCount。

设置：
${JSON.stringify(
  {
    totalCount: setting.totalCount,
    dialogueCount: setting.dialogueCount,
    monologueCount: setting.monologueCount,
    interviewCount: setting.interviewCount,
    articleCount: setting.articleCount,
    ieltsCount: setting.ieltsCount,
    learningGoal: setting.learningGoal,
    focusNote: setting.focusNote,
  },
  null,
  2,
)}

现有语料库概况：
${JSON.stringify(summary, null, 2)}

返回结构：
{
  "strategySummary": "一句话说明今天为什么补这些语料",
  "plans": [
    {
      "contentType": "dialogue",
      "topic": "项目讨论",
      "categoryPath": ["Work", "Project Discussion"],
      "reason": "补足日常项目沟通输入"
    }
  ],
  "materials": [
    {
      "title": "A Quick Sync Before the Demo",
      "contentType": "dialogue",
      "categoryPath": ["Work", "Project Discussion"],
      "zh": "",
      "en": "",
      "scene": "项目演示前同步",
      "level": "B1-B2",
      "usage": "练习确认进度、澄清风险和安排后续动作",
      "note": "",
      "difficulty": 3,
      "tags": ["project", "meeting"],
      "variants": [],
      "segments": [
        {
          "order": 0,
          "segmentType": "line",
          "speaker": "Tim",
          "zh": "演示前我们先快速确认一下。",
          "en": "Let's do a quick check before the demo.",
          "note": ""
        }
      ]
    }
  ]
}`;
}

async function callDeepSeekForDailyMaterials(prompt: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("missing_deepseek_key");
  }

  const response = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "你只输出严格 JSON。内容必须适合英语学习，不要包含无关解释。",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 6000,
    }),
  });

  if (!response.ok) {
    throw new Error(`deepseek_error_${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("empty_ai_response");
  }

  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new Error("invalid_ai_json");
  }
}

export async function runDailyGeneration(
  options: RunDailyGenerationOptions,
): Promise<DailyActionResult> {
  const setting = await getOrCreateDailyGenerationSetting();
  const pendingDraftCount = await db.dailyGeneratedMaterialDraft.count({
    where: { status: "pending" },
  });

  if (options.requireEnabled && !setting.enabled) {
    const batch = await db.dailyGenerationBatch.create({
      data: {
        status: "skipped",
        reason: "disabled",
        pendingDraftCountBefore: pendingDraftCount,
      },
    });

    return {
      ok: true,
      status: "skipped",
      reason: "disabled",
      batchId: batch.id,
      message: "每日语料未开启。",
    };
  }

  if (pendingDraftCount >= setting.maxPendingDrafts) {
    const batch = await db.dailyGenerationBatch.create({
      data: {
        status: "skipped",
        reason: "pending_limit_reached",
        pendingDraftCountBefore: pendingDraftCount,
      },
    });

    return {
      ok: true,
      status: "skipped",
      reason: "pending_limit_reached",
      batchId: batch.id,
      message: getPauseMessage(),
    };
  }

  const batch = await db.dailyGenerationBatch.create({
    data: {
      status: "pending",
      reason: options.source,
      pendingDraftCountBefore: pendingDraftCount,
    },
  });

  try {
    const summary = await collectLibrarySummary();
    const prompt = buildDailyPrompt({ setting, summary });
    const rawOutput = await callDeepSeekForDailyMaterials(prompt);
    const parsed = DailyGenerationOutputSchema.safeParse(rawOutput);

    if (!parsed.success) {
      throw new Error(`validation_failed: ${formatDailyZodError(parsed.error)}`);
    }

    const materials = parsed.data.materials.slice(0, setting.totalCount);

    await db.$transaction(async (tx) => {
      await tx.dailyGenerationBatch.update({
        where: { id: batch.id },
        data: {
          status: "generated",
          planJson: JSON.stringify(
            {
              strategySummary: parsed.data.strategySummary,
              plans: parsed.data.plans,
            },
            null,
            2,
          ),
        },
      });

      for (const material of materials) {
        await tx.dailyGeneratedMaterialDraft.create({
          data: {
            batchId: batch.id,
            title: material.title,
            contentType: material.contentType,
            categoryPathJson: JSON.stringify(material.categoryPath),
            contentJson: JSON.stringify(material, null, 2),
            status: "pending",
          },
        });
      }
    });

    return {
      ok: true,
      status: "generated",
      batchId: batch.id,
      draftCount: materials.length,
      message: `已生成 ${materials.length} 篇待审核草稿。`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_generation_error";

    await db.dailyGenerationBatch.update({
      where: { id: batch.id },
      data: {
        status: "failed",
        error: message,
      },
    });

    return {
      ok: false,
      status: "failed",
      batchId: batch.id,
      message: "生成失败，稍后再试。",
      errors: [message],
    };
  }
}

async function findCategoryByPath(path: string[]) {
  if (path.length === 0) return null;

  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, parentId: true, name: true },
  });
  const getPath = buildCategoryPaths(categories);

  return categories.find((category) => {
    const categoryPath = getPath(category.id);
    return categoryPath.length === path.length && categoryPath.every((name, index) => name === path[index]);
  }) ?? null;
}

async function ensureCategoryPath(
  tx: Prisma.TransactionClient,
  path: string[],
) {
  let parentId: string | null = null;

  for (const rawName of path) {
    const name = rawName.trim();
    if (!name) continue;

    const existing: { id: string } | null = await tx.category.findFirst({
      where: { parentId, name },
      select: { id: true },
    });

    if (existing) {
      parentId = existing.id;
      continue;
    }

    const siblingCount = await tx.category.count({ where: { parentId } });
    const created: { id: string } = await tx.category.create({
      data: {
        parentId,
        name,
        sortOrder: siblingCount,
      },
      select: { id: true },
    });

    parentId = created.id;
  }

  if (!parentId) {
    const fallback = await tx.category.findFirst({
      where: { parentId: null, name: DEFAULT_CATEGORY_NAME },
      select: { id: true },
    });
    if (fallback) return fallback.id;

    const siblingCount = await tx.category.count({ where: { parentId: null } });
    const created: { id: string } = await tx.category.create({
      data: { name: DEFAULT_CATEGORY_NAME, sortOrder: siblingCount },
      select: { id: true },
    });
    return created.id;
  }

  return parentId;
}

async function updateBatchAfterDraftHandled(tx: Prisma.TransactionClient, batchId: string) {
  const pendingCount = await tx.dailyGeneratedMaterialDraft.count({
    where: { batchId, status: "pending" },
  });
  if (pendingCount > 0) return;

  const [acceptedCount, rejectedCount] = await Promise.all([
    tx.dailyGeneratedMaterialDraft.count({ where: { batchId, status: "accepted" } }),
    tx.dailyGeneratedMaterialDraft.count({ where: { batchId, status: "rejected" } }),
  ]);

  await tx.dailyGenerationBatch.update({
    where: { id: batchId },
    data: {
      status: acceptedCount > 0 && rejectedCount === 0 ? "imported" : "partial",
    },
  });
}

export async function acceptDailyGeneratedDraft(draftId: string): Promise<DailyActionResult> {
  const setting = await getOrCreateDailyGenerationSetting();
  const draft = await db.dailyGeneratedMaterialDraft.findUnique({
    where: { id: draftId },
  });

  if (!draft || draft.status !== "pending") {
    return { ok: false, message: "草稿不存在或已处理。" };
  }

  let parsedContent: DailyMaterialDraftContent;
  try {
    parsedContent = DailyMaterialDraftContentSchema.parse(JSON.parse(draft.contentJson));
  } catch (error) {
    return {
      ok: false,
      message: "草稿内容格式不正确。",
      errors: [error instanceof Error ? error.message : "未知格式错误"],
    };
  }

  const existingCategory = await findCategoryByPath(parsedContent.categoryPath);
  const targetPath =
    existingCategory || setting.allowSuggestCategory
      ? parsedContent.categoryPath
      : [DEFAULT_CATEGORY_NAME];

  try {
    const material = await db.$transaction(async (tx) => {
      const categoryId = existingCategory?.id ?? (await ensureCategoryPath(tx, targetPath));

      const created = await tx.material.create({
        data: {
          categoryId,
          title: parsedContent.title,
          zh: parsedContent.zh || "",
          en: parsedContent.en || "",
          contentType: parsedContent.contentType,
          scene: normalizeOptional(parsedContent.scene),
          level: normalizeOptional(parsedContent.level),
          usage: normalizeOptional(parsedContent.usage),
          note: normalizeOptional(parsedContent.note),
          difficulty: parsedContent.difficulty,
          variants: {
            create: parsedContent.variants.map((variant) => ({
              type: variant.type,
              text: variant.text,
              note: normalizeOptional(variant.note),
            })),
          },
        },
        select: { id: true },
      });

      if (parsedContent.segments.length > 0) {
        await tx.materialSegment.createMany({
          data: parsedContent.segments.map((segment) => ({
            materialId: created.id,
            order: segment.order,
            segmentType: segment.segmentType,
            speaker: normalizeOptional(segment.speaker),
            zh: segment.zh.trim(),
            en: segment.en.trim(),
            note: normalizeOptional(segment.note),
          })),
        });
      }

      for (const tagName of normalizeTags(parsedContent.tags)) {
        const tag = await tx.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
          select: { id: true },
        });

        await tx.materialTag.create({
          data: {
            materialId: created.id,
            tagId: tag.id,
          },
        });
      }

      await tx.dailyGeneratedMaterialDraft.update({
        where: { id: draft.id },
        data: {
          status: "accepted",
          materialId: created.id,
        },
      });

      await updateBatchAfterDraftHandled(tx, draft.batchId);

      return created;
    });

    return {
      ok: true,
      message: "已接受入库。",
      materialId: material.id,
    };
  } catch (error) {
    return {
      ok: false,
      message: "入库失败，稍后再试。",
      errors: [error instanceof Error ? error.message : "未知数据库错误"],
    };
  }
}

export async function rejectDailyGeneratedDraft(draftId: string): Promise<DailyActionResult> {
  const draft = await db.dailyGeneratedMaterialDraft.findUnique({
    where: { id: draftId },
    select: { id: true, status: true, batchId: true },
  });

  if (!draft || draft.status !== "pending") {
    return { ok: false, message: "草稿不存在或已处理。" };
  }

  await db.$transaction(async (tx) => {
    await tx.dailyGeneratedMaterialDraft.update({
      where: { id: draft.id },
      data: { status: "rejected" },
    });

    await updateBatchAfterDraftHandled(tx, draft.batchId);
  });

  return { ok: true, message: "已拒绝草稿。" };
}
