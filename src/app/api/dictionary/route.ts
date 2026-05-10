import { NextResponse } from "next/server";

const DICT_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";

type DictionaryResult = {
  ok: true;
  data: { ipa: string; audioUrl: string | null } | null;
} | { ok: false; error: string };

export async function POST(request: Request): Promise<NextResponse<DictionaryResult>> {
  try {
    const body = await request.json();
    const word: string = (body.word || "").trim().toLowerCase();

    if (!word || !/^[a-zA-Z]+$/.test(word)) {
      return NextResponse.json(
        { ok: false, error: "无效的单词。" },
        { status: 400 },
      );
    }

    const response = await fetch(`${DICT_BASE}/${encodeURIComponent(word)}`);

    if (response.status === 404) {
      return NextResponse.json({ ok: true, data: null });
    }

    if (!response.ok) {
      console.error("Dictionary API error", response.status);
      return NextResponse.json({ ok: true, data: null });
    }

    const entries = await response.json();
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ ok: true, data: null });
    }

    // Find the first phonetics entry with text (IPA), preferring one with audio
    let ipa = "";
    let audioUrl: string | null = null;

    for (const entry of entries) {
      const phonetics = entry.phonetics as Array<{ text?: string; audio?: string }> | undefined;
      if (!phonetics) continue;

      for (const p of phonetics) {
        if (!ipa && p.text) {
          ipa = p.text;
        }
        if (p.text && p.audio) {
          ipa = p.text;
          audioUrl = p.audio;
          break;
        }
      }
      if (ipa && audioUrl) break;
    }

    if (!ipa) {
      return NextResponse.json({ ok: true, data: null });
    }

    return NextResponse.json({
      ok: true,
      data: { ipa, audioUrl },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Dictionary API error", message);
    return NextResponse.json({ ok: true, data: null });
  }
}
