import { NextResponse } from "next/server";
import {
  AIScoredResultSchema,
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
    const referenceSegments: { segmentIndex: number; en: string; zh: string }[] =
      body.referenceSegments;
    const userAnswers: { segmentIndex: number; userAnswer: string }[] =
      body.userAnswers;

    if (!referenceSegments?.length || !userAnswers?.length) {
      return NextResponse.json(
        { ok: false, error: "referenceSegments 和 userAnswers 不能为空。" },
        { status: 400 },
      );
    }

    const systemPrompt = `You are an expert English teacher evaluating Chinese-to-English translation exercises for Chinese English learners.

Given the original English text (as reference) and the student's translation of each Chinese segment, evaluate each segment thoroughly.

Output MUST be valid JSON matching this schema:

{
  overallScore: number,                   // 0-100 weighted overall score
  summaryZh: string,                      // overall assessment in Chinese (2-4 sentences)
  priorityImprovements: string[],         // top 2-3 areas to improve, in Chinese
  segments: Array<{
    segmentIndex: number,                 // matches the input segment index
    score: number,                        // 0-100 overall score for this segment
    semanticAccuracy: number,             // 0-100 (how well the meaning is preserved)
    grammar: number,                      // 0-100 (grammatical correctness)
    naturalness: number,                  // 0-100 (how natural/idiomatic the English sounds)
    feedbackZh: string,                   // constructive feedback in Chinese (1-3 sentences)
    correctedVersion: string,             // your corrected English version of the student's answer
    keyIssues: string[]                   // list of key problems (empty array if the answer is excellent)
  }>
}

Rules:
- Score strictly but fairly. A native-like translation should score 90+.
- If the student's answer is essentially correct but slightly unnatural, score 70-85.
- If the answer has significant grammar or meaning errors, score below 60.
- semanticAccuracy: how close the meaning is to the reference.
- grammar: tense, agreement, word order, prepositions, etc.
- naturalness: does it sound like natural English (not translated Chinese-English).
- feedbackZh must be specific and constructive, pointing out what to improve.
- correctedVersion must be a natural, idiomatic English version.
- keyIssues should be short tags in Chinese like "时态错误", "词序不当", "缺少冠词".
- Do NOT include any text outside the JSON object.`;

    const userPrompt = `Evaluate the student's Chinese-to-English translations.

Reference text (${referenceSegments.length} segments):
${referenceSegments
  .map(
    (seg) =>
      `[Segment ${seg.segmentIndex}]\nZH (to translate): ${seg.zh}\nReference EN: ${seg.en}`,
  )
  .join("\n\n")}

Student's answers:
${userAnswers
  .map((a) => `[Segment ${a.segmentIndex}] Student EN: ${a.userAnswer || "(未作答)"}`)
  .join("\n")}`;

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
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error (zh-to-en score)", response.status, errorText);
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
      console.error("DeepSeek returned non-JSON for zh-to-en score", content.slice(0, 500));
      return NextResponse.json(
        { ok: false, error: "AI 返回的内容不是有效的 JSON，请重试。" },
        { status: 502 },
      );
    }

    const result = AIScoredResultSchema.safeParse(parsed);
    if (!result.success) {
      console.error("Zh-to-En score Zod validation failed", result.error.issues);
      return NextResponse.json(
        { ok: false, error: "AI 评分的格式不符合预期，请重试。" },
        { status: 422 },
      );
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("zh-to-en score API error", error);
    return NextResponse.json(
      { ok: false, error: "评分失败，请查看终端日志。" },
      { status: 500 },
    );
  }
}
