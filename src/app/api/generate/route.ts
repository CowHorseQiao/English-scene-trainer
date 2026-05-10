import { NextResponse } from "next/server";
import { AIGeneratedSchema, formatZodError } from "@/features/ai/schemas";
import { buildSystemPrompt, buildUserPrompt } from "@/features/ai/prompt";
import type { ContentType, GenerateResult } from "@/features/ai/types";

const DEEPSEEK_BASE = "https://api.deepseek.com/v1";

export async function POST(request: Request): Promise<NextResponse<GenerateResult>> {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "未配置 DEEPSEEK_API_KEY 环境变量。请在 .env 中设置后重启 dev server。" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const contentType: ContentType = body.contentType;
    const topic: string = body.topic;
    const difficulty: number = body.difficulty;
    const length: string = body.length;
    const style: string = body.style;
    const level: string | undefined = body.level;

    if (!contentType || !topic) {
      return NextResponse.json(
        { ok: false, error: "contentType 和 topic 为必填项。" },
        { status: 400 },
      );
    }

    const systemPrompt = buildSystemPrompt(contentType);
    const userPrompt = buildUserPrompt({ contentType, topic, difficulty, length, style, level });

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
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error", response.status, errorText);
      return NextResponse.json(
        { ok: false, error: `DeepSeek API 返回错误（${response.status}）。请稍后重试。` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("DeepSeek returned empty content", data);
      return NextResponse.json(
        { ok: false, error: "AI 返回了空内容，请重试。" },
        { status: 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("DeepSeek returned non-JSON", content.slice(0, 500));
      return NextResponse.json(
        { ok: false, error: "AI 返回的内容不是有效的 JSON，请重试。" },
        { status: 502 },
      );
    }

    const result = AIGeneratedSchema.safeParse(parsed);
    if (!result.success) {
      const details = formatZodError(result.error);
      console.error("Zod validation failed", details);
      return NextResponse.json(
        { ok: false, error: "AI 生成的内容格式不符合预期，请重试。", details },
        { status: 422 },
      );
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("generate API error", error);
    return NextResponse.json(
      { ok: false, error: "生成失败，请查看终端日志。" },
      { status: 500 },
    );
  }
}
