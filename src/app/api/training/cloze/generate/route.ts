import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  AIGeneratedClozeSchema,
  formatClozeZodError,
} from "@/features/training/training-schemas";

const DEEPSEEK_BASE = "https://api.deepseek.com/v1";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "未配置 DEEPSEEK_API_KEY 环境变量。" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const materialId: string | undefined = body.materialId;

    if (!materialId) {
      return NextResponse.json(
        { ok: false, error: "materialId 为必填项。" },
        { status: 400 },
      );
    }

    // Check cache
    const cached = await db.practiceExerciseCache.findUnique({
      where: { materialId_mode: { materialId, mode: "cloze" } },
    });

    if (cached) {
      try {
        const exercises = JSON.parse(cached.exercises);
        return NextResponse.json({ ok: true, data: exercises, cached: true });
      } catch {
        // Cache corrupted, regenerate
        await db.practiceExerciseCache.delete({
          where: { materialId_mode: { materialId, mode: "cloze" } },
        });
      }
    }

    // Fetch material with segments
    const material = await db.material.findUnique({
      where: { id: materialId },
      include: {
        segments: { orderBy: { order: "asc" } },
      },
    });

    if (!material) {
      return NextResponse.json(
        { ok: false, error: "语料不存在。" },
        { status: 404 },
      );
    }

    // Build segments data for AI
    const segmentsData = material.segments.length > 0
      ? material.segments.map((seg) => ({
          index: seg.order,
          en: seg.en,
          zh: seg.zh,
          speaker: seg.speaker,
        }))
      : [{ index: 0, en: material.en, zh: material.zh, speaker: null }];

    const systemPrompt = `You are an expert English teacher creating cloze (fill-in-the-blank) exercises for Chinese English learners.

Given an English text divided into segments, create a cloze exercise where key words and phrases are replaced with numbered blanks.

Output MUST be valid JSON matching this schema:

{
  segments: Array<{
    segmentIndex: number,          // matches the input segment index
    enWithBlanks: string,          // the English text with blanks like "The ____1____ of..."
    blanks: Array<{
      index: number,               // blank number (1-based, globally unique)
      answer: string,              // the correct word or phrase
      type: "keyword" | "collocation" | "grammar" | "phrase",
      hint?: string,               // brief Chinese hint for difficult blanks
      explanation: string          // brief explanation in Chinese
    }>
  }>
}

Rules:
- Select meaningful blanks: keywords, collocations, grammar structures, and key phrases.
- Do NOT blank out articles (a, an, the), simple prepositions (in, on, at), or basic pronouns, unless they are part of a grammar exercise.
- Each blank must have a clear, unambiguous answer.
- Blank types: "keyword" (key vocabulary), "collocation" (fixed word combinations), "grammar" (grammar patterns like tense/aspect), "phrase" (meaningful multi-word expression).
- Hints in Chinese (optional, only for harder blanks).
- Explanations in Chinese, brief (1-2 sentences max).
- Keep the original text structure — only replace target words with blanks.
- Blanks are numbered sequentially across ALL segments (1, 2, 3...).
- Each segment should have 2-5 blanks, depending on its length.
- If a segment has no suitable content for blanks, OMIT it from the segments array entirely — do not include it with an empty blanks array.
- Do NOT include any text outside the JSON object.`;

    const userPrompt = `Create cloze exercises for the following English text. The text is divided into ${segmentsData.length} segments.

${segmentsData
  .map(
    (seg) =>
      `[Segment ${seg.index}]${seg.speaker ? ` (${seg.speaker})` : ""}\nEN: ${seg.en}\nZH: ${seg.zh}`,
  )
  .join("\n\n")}`;

    const response = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error (cloze)", response.status, errorText);
      return NextResponse.json(
        { ok: false, error: `DeepSeek API 返回错误（${response.status}）。请稍后重试。` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { ok: false, error: "AI 返回了空内容，请重试。" },
        { status: 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("DeepSeek returned non-JSON for cloze", content.slice(0, 500));
      return NextResponse.json(
        { ok: false, error: "AI 返回的内容不是有效的 JSON，请重试。" },
        { status: 502 },
      );
    }

    // Filter out segments with empty blanks before validation
    const raw = parsed as { segments?: Array<{ blanks?: unknown[] } & Record<string, unknown>> };
    if (raw.segments) {
      raw.segments = raw.segments.filter((seg) => seg.blanks && seg.blanks.length > 0);
    }

    const result = AIGeneratedClozeSchema.safeParse(raw);
    if (!result.success) {
      const details = formatClozeZodError(result.error);
      console.error("Cloze Zod validation failed", details);
      return NextResponse.json(
        { ok: false, error: "AI 生成的挖空题格式不符合预期，请重试。", details },
        { status: 422 },
      );
    }

    // Cache the result
    await db.practiceExerciseCache.create({
      data: {
        materialId,
        mode: "cloze",
        exercises: JSON.stringify(result.data),
      },
    });

    return NextResponse.json({ ok: true, data: result.data, cached: false });
  } catch (error) {
    console.error("cloze generate API error", error);
    return NextResponse.json(
      { ok: false, error: "生成失败，请查看终端日志。" },
      { status: 500 },
    );
  }
}
