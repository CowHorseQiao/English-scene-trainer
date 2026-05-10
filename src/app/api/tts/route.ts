import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { audioCacheKey, getCachedAudio, setCachedAudio } from "@/lib/audio-cache";

const MAX_TEXT_BYTES = 1024;
const TTS_ENDPOINT = "https://openspeech.bytedance.com/api/v1/tts";

type TtsResult = { ok: true; audioBase64: string } | { ok: false; error: string };

export async function POST(request: Request): Promise<NextResponse<TtsResult>> {
  try {
    if (process.env.ENABLE_REMOTE_TTS !== "true") {
      return NextResponse.json(
        { ok: false, error: "远程 TTS 未启用。" },
        { status: 401 },
      );
    }

    const appId = process.env.VOLCENGINE_TTS_APP_ID;
    const accessToken = process.env.VOLCENGINE_TTS_ACCESS_TOKEN;
    const defaultVoiceType = process.env.VOLCENGINE_TTS_VOICE_TYPE;
    const cluster = process.env.VOLCENGINE_TTS_CLUSTER || "volcano_tts";

    if (!appId || !accessToken) {
      return NextResponse.json(
        { ok: false, error: "未配置火山引擎 TTS 凭证。" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const text: string = (body.text || "").trim();

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "请提供需要播放的文本。" },
        { status: 400 },
      );
    }

    // Use voiceType from body (per-speaker), fallback to env default
    const voiceType = body.voiceType || defaultVoiceType;
    if (!voiceType) {
      return NextResponse.json(
        { ok: false, error: "未配置 TTS 音色。" },
        { status: 401 },
      );
    }

    const materialId: string | undefined = body.materialId || undefined;

    // Truncate to 1024 bytes (Volcengine API limit)
    const textBytes = Buffer.byteLength(text, "utf-8");
    const safeText = textBytes > MAX_TEXT_BYTES
      ? text.slice(0, Math.floor(MAX_TEXT_BYTES / 2))
      : text;

    const speed = body.speed ?? (Number(process.env.VOLCENGINE_TTS_SPEED_RATIO) || 1);
    const pitch = body.pitch ?? (Number(process.env.VOLCENGINE_TTS_PITCH_RATIO) || 1);
    const volume = body.volume ?? (Number(process.env.VOLCENGINE_TTS_VOLUME_RATIO) || 1);
    const sampleRate = Number(process.env.VOLCENGINE_TTS_RATE) || 24000;

    const hash = audioCacheKey({ text: safeText, voiceType, speed, pitch, volume });

    const cached = getCachedAudio(hash, materialId);
    if (cached) {
      return NextResponse.json({ ok: true, audioBase64: cached.toString("base64") });
    }

    const ttsResponse = await fetch(TTS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer;${accessToken}`,
      },
      body: JSON.stringify({
        app: {
          appid: appId,
          token: accessToken,
          cluster,
        },
        user: {
          uid: "english-scene-trainer",
        },
        audio: {
          voice_type: voiceType,
          encoding: "mp3",
          rate: sampleRate,
          speed_ratio: speed,
          pitch_ratio: pitch,
          volume_ratio: volume,
        },
        request: {
          reqid: randomUUID(),
          text: safeText,
          text_type: "plain",
          operation: "query",
        },
      }),
    });

    const data = await ttsResponse.json();

    if (data.code !== 3000) {
      console.error("Volcengine TTS API error", data.code, data.message);
      return NextResponse.json(
        { ok: false, error: `火山引擎 TTS 返回错误（${data.code}: ${data.message || "未知错误"}）。` },
        { status: 502 },
      );
    }

    const audioBase64: string = data.data;
    if (!audioBase64) {
      return NextResponse.json(
        { ok: false, error: "火山引擎 TTS 返回了空的音频内容。" },
        { status: 502 },
      );
    }

    const audioBuffer = Buffer.from(audioBase64, "base64");
    setCachedAudio(hash, audioBuffer, materialId);

    return NextResponse.json({ ok: true, audioBase64 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("TTS API error", message);
    return NextResponse.json(
      { ok: false, error: `TTS 请求失败：${message}` },
      { status: 500 },
    );
  }
}
