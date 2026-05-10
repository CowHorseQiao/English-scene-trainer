import type { ContentType } from "./types";

const SPEAKER_INTRO = `Fixed speaker roles (you must ONLY use these names for speaker fields):
- Tim: male English speaker, calm and natural
- Dacey: female English speaker, clear and friendly
- Stokie: female English speaker, casual and expressive
- Tina: female English teaching voice, suitable for explanations and teaching scenes`;

const SEGMENT_HINTS: Record<ContentType, string> = {
  monologue: [
    `- segments: 按段落（paragraph）组织，每段是一个自然段落。`,
    `- 每个 segment 必须指定 speaker。默认单人自述使用 Dacey（清晰友好）。`,
    `- 教学解释类内容可使用 Tina。`,
    `- speaker 只能从 Tim、Dacey、Stokie、Tina 中选择，不得超过 4 个不同 speaker。`,
  ].join("\n"),
  dialogue: [
    `- segments: 按对话行（line）组织，每行标注 speaker。`,
    `- 日常对话优先使用 Tim + Dacey 或 Tim + Stokie 的组合。`,
    `- speaker 只能从 Tim、Dacey、Stokie、Tina 中选择，不得超过 4 个不同 speaker。`,
  ].join("\n"),
  article: [
    `- segments: 按段落（paragraph）组织，每段是一个自然段落。`,
    `- 每个 segment 必须指定 speaker。简短文默认使用 Dacey。`,
    `- speaker 只能从 Tim、Dacey、Stokie、Tina 中选择。`,
  ].join("\n"),
  interview: [
    `- segments: 按问答（qa）组织，每个 segment 是一问一答，用 speaker 标注提问者和回答者。`,
    `- 面试官推荐使用 Tim（沉稳自然），候选人推荐使用 Dacey 或 Stokie。`,
    `- speaker 只能从 Tim、Dacey、Stokie、Tina 中选择，不得超过 4 个不同 speaker。`,
  ].join("\n"),
  ielts: [
    `- segments: 按段落（paragraph）组织，每段对应一个论述要点或范例。`,
    `- 每个 segment 必须指定 speaker。默认使用 Dacey，讲解部分可用 Tina。`,
    `- speaker 只能从 Tim、Dacey、Stokie、Tina 中选择。`,
  ].join("\n"),
};

export function buildSystemPrompt(contentType: ContentType): string {
  const segmentHint = SEGMENT_HINTS[contentType];

  return `You are an expert English learning material creator. Generate a structured ${contentType} material for Chinese English learners.

${SPEAKER_INTRO}

Output MUST be valid JSON matching this TypeScript schema:

{
  title: string,              // max 120 chars, a concise descriptive title
  contentType: "${contentType}",
  scene?: string,             // the scenario or context (e.g. "保研英语面试", "雅思口语Part2")
  level?: string,             // CEFR level if applicable (e.g. "B2", "C1")
  usage?: string,             // a brief note about when/how to use this material
  note?: string,              // any other notes (grammar tips, cultural notes, etc.)
  difficulty: number,         // 1-5 difficulty level
  tags: string[],             // 2-5 relevant tags (each max 30 chars)
  segments: Array<{
    order: number,            // zero-based index
    segmentType: "paragraph" | "line" | "qa",
    speaker?: string,         // MUST be one of: Tim, Dacey, Stokie, Tina
    en: string,               // English text (natural, idiomatic)
    zh: string,               // Chinese translation (accurate, natural)
    note?: string             // optional note for this segment (key vocabulary, grammar point)
  }>
}

Rules:
- All English must be natural and idiomatic, suitable for the specified difficulty level.
- All Chinese translations must be accurate and natural.
- For difficulty 1-2: use simple vocabulary and short sentences.
- For difficulty 3: use intermediate vocabulary with some complex structures.
- For difficulty 4-5: use advanced vocabulary, idioms, and complex sentence structures.
${segmentHint}
- speaker values MUST be exactly one of: Tim, Dacey, Stokie, Tina. Never use generic names like "Alex", "Emma", "Speaker A", "Interviewer", "Student".
- Include 2-5 relevant tags that describe the topic, scenario, or key language features.
- title, scene, usage, note, tags should ALL be in Chinese.
- Do NOT include any text outside the JSON object.`;
}

export function buildUserPrompt(input: {
  contentType: ContentType;
  topic: string;
  difficulty: number;
  length: string;
  style: string;
  level?: string;
}): string {
  const parts = [
    `请生成一篇${CONTENT_TYPE_CN[input.contentType]}类型的英语学习语料。`,
    ``,
    `主题/场景：${input.topic}`,
  ];

  if (input.level) {
    parts.push(`目标等级：${input.level}`);
  }

  parts.push(
    `难度：${input.difficulty}/5`,
    `长度：${input.length}`,
    `风格要求：${input.style}`,
    ``,
    `请直接输出 JSON，不要包含任何解释或 markdown 代码块。`,
  );

  return parts.join("\n");
}

const CONTENT_TYPE_CN: Record<ContentType, string> = {
  monologue: "独白/自述",
  dialogue: "对话",
  article: "短文",
  interview: "访谈",
  ielts: "雅思语料",
};
