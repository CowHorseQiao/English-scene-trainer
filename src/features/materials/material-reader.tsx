"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { FavoriteFormDialog } from "@/features/favorites/favorite-form-dialog";
import { getVoiceTypeForSpeaker } from "@/features/speakers/roles";
import { useTTS } from "./use-tts";
import type { SegmentQueueItem } from "./use-tts";
import { SegmentPlayButton, TtsBar } from "./tts-bar";
import { TranslateDialog } from "./translate-dialog";
import type { MaterialDetail } from "./types";

type TranslateData = {
  chineseMeaning: string;
  explanation: string;
  usage: string;
  example?: string;
};

type MaterialReaderProps = {
  material: MaterialDetail;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function MaterialReader({ material }: MaterialReaderProps) {
  const contentType = material.contentType || "sentence";
  const segments = material.segments || [];
  const containerRef = useRef<HTMLDivElement>(null);
  const tts = useTTS();

  const [showZh, setShowZh] = useState(true);

  // Selection state
  const [selectionText, setSelectionText] = useState("");
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number } | null>(null);
  const selectionContextRef = useRef("");

  useEffect(() => {
    function handleSelectionChange() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelectionText("");
        setSelectionPos(null);
        return;
      }
      if (sel.rangeCount === 0) {
        setSelectionText("");
        setSelectionPos(null);
        return;
      }
      const text = sel.toString().trim();
      if (!/[a-zA-Z]/.test(text)) {
        setSelectionText("");
        setSelectionPos(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setSelectionText("");
        setSelectionPos(null);
        return;
      }
      const parentEl = range.commonAncestorContainer?.parentElement;
      selectionContextRef.current = parentEl?.textContent?.trim() || "";
      setSelectionText(text);
      setSelectionPos({ x: rect.left + rect.width / 2, y: rect.top });
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  // Translate state
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [translateData, setTranslateData] = useState<TranslateData | null>(null);
  const [translateSource, setTranslateSource] = useState("");
  const [wordData, setWordData] = useState<{ ipa: string; audioUrl: string | null } | null>(null);

  // Favorite state
  const [favoriteOpen, setFavoriteOpen] = useState(false);
  const [favoriteDefaults, setFavoriteDefaults] = useState<{
    text: string;
    sourceSentence: string;
  }>({ text: "", sourceSentence: "" });

  function findSourceSentence(text: string): string {
    for (const seg of segments) {
      if (seg.en?.includes(text)) return seg.en;
    }
    if (material.en?.includes(text)) return material.en;
    return text;
  }

  function handleClearSelection() {
    setSelectionText("");
    window.getSelection()?.removeAllRanges();
  }

  // TTS handlers
  function handlePlayFull() {
    const items: SegmentQueueItem[] = [];
    if (material.en?.trim()) items.push({ text: material.en });
    for (const seg of segments) {
      if (seg.en?.trim()) {
        items.push({
          text: seg.en,
          voiceType: getVoiceTypeForSpeaker(seg.speaker, ""),
        });
      }
    }
    tts.speakQueue(items);
  }

  function handlePlaySegment(en: string, speaker?: string) {
    const vt = getVoiceTypeForSpeaker(speaker, "");
    tts.speak(en, vt || undefined);
  }

  // Selection handlers
  function handlePlaySelection() {
    if (!selectionText.trim()) return;
    let voiceType: string | undefined;
    for (const seg of segments) {
      if (seg.en?.includes(selectionText)) {
        voiceType = getVoiceTypeForSpeaker(seg.speaker, "") || undefined;
        break;
      }
    }
    tts.speak(selectionText, voiceType);
    setSelectionText("");
    window.getSelection()?.removeAllRanges();
  }

  async function handleTranslateSelection() {
    if (!selectionText.trim()) return;
    const text = selectionText.trim();

    setTranslateOpen(true);
    setTranslateLoading(true);
    setTranslateError(null);
    setTranslateData(null);
    setWordData(null);
    setTranslateSource(text);

    const isSingleWord = /^[a-zA-Z]+$/.test(text);
    const dictPromise = isSingleWord
      ? fetch("/api/dictionary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: text }),
        })
          .then((r) => r.json())
          .then((r) => {
            if (r.ok && r.data) setWordData(r.data);
          })
          .catch(() => {})
      : Promise.resolve();

    setSelectionText("");
    window.getSelection()?.removeAllRanges();

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context: selectionContextRef.current || undefined }),
      });
      const result = await response.json();
      if (!result.ok) {
        setTranslateError(result.error || "翻译失败，请重试。");
        return;
      }
      setTranslateData(result.data);
    } catch {
      setTranslateError("网络请求失败，请检查网络连接。");
    } finally {
      setTranslateLoading(false);
    }

    await dictPromise;
  }

  function handlePlayWord(audioUrl: string | null, word: string) {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => tts.speak(word));
    } else {
      tts.speak(word);
    }
  }

  function handleFavoriteSelection() {
    if (!selectionText.trim()) return;
    setFavoriteDefaults({
      text: selectionText,
      sourceSentence: findSourceSentence(selectionText),
    });
    setFavoriteOpen(true);
    setSelectionText("");
    window.getSelection()?.removeAllRanges();
  }

  const mainText = material.en?.trim();

  return (
    <main className="mx-auto max-w-3xl space-y-6" ref={containerRef}>
      <section>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← 返回首页
        </Link>
        <h1 className="mt-3 break-words text-2xl font-semibold leading-tight">{material.title}</h1>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="min-w-0 max-w-full break-words">{material.category.name}</span>
          {contentType !== "sentence" ? (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {CONTENT_TYPE_LABELS[contentType] || contentType}
            </Badge>
          ) : null}
          {material.scene ? (
            <Badge variant="outline" className="max-w-full break-words text-xs">
              {material.scene}
            </Badge>
          ) : null}
          <span className="shrink-0">·</span>
          <span className="shrink-0">{formatDateTime(material.createdAt)}</span>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <TtsBar
            supported={tts.supported}
            speaking={tts.speaking}
            paused={tts.paused}
            rate={tts.rate}
            providerName={tts.providerName}
            onPlayFull={handlePlayFull}
            onPause={tts.pause}
            onResume={tts.resume}
            onStop={tts.stop}
            onRateChange={tts.setRate}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowZh((v) => !v)}
          className="w-full sm:w-auto"
        >
          {showZh ? "隐藏中文" : "显示中文"}
        </Button>
      </div>

      {mainText ? (
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="break-words text-lg leading-8 whitespace-pre-wrap">{material.en}</p>
                {showZh && material.zh?.trim() ? (
                  <p className="mt-4 break-words whitespace-pre-wrap border-l-2 border-muted pl-3 text-base leading-7 text-muted-foreground sm:pl-4">
                    {material.zh}
                  </p>
                ) : null}
              </div>
              <SegmentPlayButton onClick={() => handlePlaySegment(material.en)} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {segments.length > 0 ? (
        <SegmentsReader
          contentType={contentType}
          segments={segments}
          showZh={showZh}
          onPlaySegment={handlePlaySegment}
        />
      ) : null}

      {material.usage ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-words whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {material.usage}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {material.note ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">备注</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-words whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {material.note}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Selection action bar — desktop floating toolbar */}
      {selectionPos && selectionText ? (
        <div
          className="hidden sm:fixed sm:block z-50"
          onPointerDown={(e) => e.preventDefault()}
          style={{
            left: Math.max(148, Math.min(selectionPos.x, window.innerWidth - 148)),
            top: selectionPos.y - 48 > 12 ? selectionPos.y - 48 : selectionPos.y + 12,
          }}
        >
          <div className="-translate-x-1/2 flex items-center gap-0.5 rounded-lg border bg-background px-1 py-1 shadow-lg select-none">
            <Button type="button" size="sm" onClick={handlePlaySelection}>
              朗读
            </Button>
            <Button type="button" size="sm" onClick={handleTranslateSelection}>
              翻译
            </Button>
            <Button type="button" size="sm" onClick={handleFavoriteSelection}>
              收藏
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleClearSelection}>
              清除
            </Button>
          </div>
        </div>
      ) : null}

      {/* Selection action bar — mobile bottom bar */}
      {selectionText ? (
        <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] sm:hidden">
          <div className="mx-auto flex max-w-sm items-center justify-center gap-1 rounded-full border bg-background px-2 py-1.5 shadow-lg">
            <Button type="button" size="sm" className="min-h-9 flex-1 px-2" onClick={handlePlaySelection}>
              朗读
            </Button>
            <Button type="button" size="sm" className="min-h-9 flex-1 px-2" onClick={handleTranslateSelection}>
              翻译
            </Button>
            <Button type="button" size="sm" className="min-h-9 flex-1 px-2" onClick={handleFavoriteSelection}>
              收藏
            </Button>
            <Button type="button" size="sm" variant="ghost" className="min-h-9 flex-1 px-2" onClick={handleClearSelection}>
              清除
            </Button>
          </div>
        </div>
      ) : null}

      <FavoriteFormDialog
        mode="create"
        open={favoriteOpen}
        onOpenChange={(open) => {
          setFavoriteOpen(open);
          if (!open) setFavoriteDefaults({ text: "", sourceSentence: "" });
        }}
        initialValues={{
          materialId: material.id,
          text: favoriteDefaults.text,
          type: "phrase",
          sourceSentence: favoriteDefaults.sourceSentence,
        }}
      />

      <TranslateDialog
        open={translateOpen}
        onOpenChange={(open) => {
          setTranslateOpen(open);
          if (!open) {
            setTranslateData(null);
            setTranslateError(null);
            setWordData(null);
          }
        }}
        loading={translateLoading}
        error={translateError}
        sourceText={translateSource}
        data={translateData}
        wordData={wordData}
        onPlayWord={handlePlayWord}
      />
    </main>
  );
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  monologue: "独白",
  dialogue: "对话",
  article: "短文",
  interview: "访谈",
  ielts: "雅思",
};

const SEGMENT_TYPE_LABELS: Record<string, string> = {
  paragraph: "段落",
  line: "对话行",
  qa: "问答",
};

function SegmentsReader({
  contentType,
  segments,
  showZh,
  onPlaySegment,
}: {
  contentType: string;
  segments: MaterialDetail["segments"];
  showZh: boolean;
  onPlaySegment: (en: string, speaker?: string) => void;
}) {
  const label = CONTENT_TYPE_LABELS[contentType] || contentType;

  if (contentType === "dialogue") {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {segments.map((seg) => (
              <div key={seg.id} className="space-y-2 rounded-xl bg-muted/30 p-3 sm:p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {seg.speaker ? (
                    <Badge variant="secondary" className="min-w-0 max-w-[60%] break-words text-xs">
                      {seg.speaker}
                    </Badge>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    {SEGMENT_TYPE_LABELS[seg.segmentType] || seg.segmentType} {seg.order + 1}
                  </span>
                  <SegmentPlayButton
                    onClick={() => onPlaySegment(seg.en, seg.speaker || undefined)}
                  />
                </div>
                <p className="break-words whitespace-pre-wrap text-base leading-8">{seg.en}</p>
                {showZh ? (
                  <p className="break-words whitespace-pre-wrap border-l-2 border-muted pl-3 text-sm leading-7 text-muted-foreground">
                    {seg.zh}
                  </p>
                ) : null}
                {seg.note ? (
                  <p className="text-xs text-muted-foreground/70">{seg.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {segments.map((seg) => (
            <div key={seg.id} className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="min-w-0 flex-1">
                  {SEGMENT_TYPE_LABELS[seg.segmentType] || seg.segmentType} {seg.order + 1}
                </span>
                {seg.speaker ? (
                  <Badge variant="outline" className="min-w-0 max-w-[60%] break-words text-xs">
                    {seg.speaker}
                  </Badge>
                ) : null}
                <SegmentPlayButton
                  onClick={() => onPlaySegment(seg.en, seg.speaker || undefined)}
                />
              </div>
              <p className="break-words whitespace-pre-wrap text-base leading-8">{seg.en}</p>
              {showZh ? (
                <p className="break-words whitespace-pre-wrap border-l-2 border-muted pl-3 text-sm leading-7 text-muted-foreground">
                  {seg.zh}
                </p>
              ) : null}
              {seg.note ? (
                <p className="text-xs text-muted-foreground/70">{seg.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
