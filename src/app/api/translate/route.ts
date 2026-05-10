import { NextResponse } from "next/server";
import { z } from "zod";

const DEEPSEEK_BASE = "https://api.deepseek.com/v1";

const TranslateResultSchema = z.object({
  chineseMeaning: z.string().min(1),
  explanation: z.string().min(1),
  usage: z.string().min(1),
  example: z.string().optional(),
});

type TranslateResult = { ok: true; data: z.infer<typeof TranslateResultSchema> } | { ok: false; error: string };

export async function POST(request: Request): Promise<NextResponse<TranslateResult>> {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "未配置 DEEPSEEK_API_KEY 环境变量。" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const text: string = body.text?.trim();
    const context: string | undefined = body.context?.trim();

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "请提供需要翻译的文本。" },
        { status: 400 },
      );
    }

    const contextHint = context
      ? `\nContext (the surrounding paragraph where this text appears):\n"""${context}"""\n`
      : "";

    const systemPrompt = `You are an English learning assistant for Chinese speakers. Given an English word, phrase, or sentence, provide a helpful translation and explanation in Chinese.

Output MUST be valid JSON matching this schema:

{
  chineseMeaning: string,   // accurate Chinese translation
  explanation: string,      // natural explanation in Chinese: grammar, collocation, nuance, etymology if relevant
  usage: string,            // when and how to use this expression, in Chinese
  example?: string          // an additional example sentence in English (different from the input)
}

Rules:
- All fields except "example" are required.
- Write all explanations in Chinese (except the optional example).
- Be concise but thorough.
- If the text is a single word, include common collocations in the explanation.
- If the text is a phrase/idiom, explain its origin or common contexts when helpful.
- Do NOT include any text outside the JSON object.`;

    const userPrompt = `Translate and explain: "${text}"${contextHint}`;

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
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error", response.status, errorText);
      return NextResponse.json(
        { ok: false, error: `DeepSeek API 返回错误（${response.status}）。` },
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
      return NextResponse.json(
        { ok: false, error: "AI 返回的内容格式错误，请重试。" },
        { status: 502 },
      );
    }

    const result = TranslateResultSchema.safeParse(parsed);
    if (!result.success) {
      console.error("Zod validation failed", result.error.issues);
      return NextResponse.json(
        { ok: false, error: "AI 返回的翻译结果格式不符合预期，请重试。" },
        { status: 422 },
      );
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("translate API error", error);
    return NextResponse.json(
      { ok: false, error: "翻译失败，请查看终端日志。" },
      { status: 500 },
    );
  }
}
