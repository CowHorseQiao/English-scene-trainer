"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FavoriteButton } from "@/features/favorites/favorite-button";
import { FavoriteFormDialog } from "@/features/favorites/favorite-form-dialog";
import type { CategoryTreeNode } from "@/features/categories/types";
import { getSpeakerRoleByName, getVoiceTypeForSpeaker } from "@/features/speakers/roles";
import { deleteMaterial } from "./actions";
import { MaterialFormDialog } from "./material-form-dialog";
import { MaterialTagEditor } from "./material-tag-editor";
import { MaterialVariantList } from "./material-variant-list";
import { MoveMaterialDialog } from "./move-material-dialog";
import { useTTS } from "./use-tts";
import type { SegmentQueueItem } from "./use-tts";
import { SegmentPlayButton, TtsBar } from "./tts-bar";
import { TranslateDialog } from "./translate-dialog";
import type { MaterialDetail as MaterialDetailType } from "./types";

type TranslateData = {
  chineseMeaning: string;
  explanation: string;
  usage: string;
  example?: string;
};

type MaterialDetailProps = {
  material: MaterialDetailType;
  categories: CategoryTreeNode[];
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

export function MaterialDetail({ material, categories }: MaterialDetailProps) {
  const router = useRouter();
  const contentType = material.contentType || "sentence";
  const segments = useMemo(() => material.segments || [], [material.segments]);
  const containerRef = useRef<HTMLDivElement>(null);

  const tts = useTTS();

  const uniqueSpeakers = useMemo(() => {
    const names = new Set<string>();
    for (const seg of segments) {
      if (seg.speaker) names.add(seg.speaker);
    }
    return Array.from(names)
      .map((name) => getSpeakerRoleByName(name))
      .filter(Boolean);
  }, [segments]);

  const [selectionText, setSelectionText] = useState("");
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number } | null>(null);
  const selectionContextRef = useRef("");

  const [translateOpen, setTranslateOpen] = useState(false);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [translateData, setTranslateData] = useState<TranslateData | null>(null);
  const [translateSource, setTranslateSource] = useState("");
  const [wordData, setWordData] = useState<{
    ipa: string;
    audioUrl: string | null;
  } | null>(null);

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

  function handlePlaySelection() {
    if (!selectionText.trim()) return;

    // Try to match selection to a segment for speaker voiceType
    let voiceType: string | undefined;
    for (const seg of segments) {
      if (seg.en?.includes(selectionText)) {
        voiceType = getVoiceTypeForSpeaker(seg.speaker, "") || undefined;
        break;
      }
    }

    tts.speak(selectionText, voiceType);
    setSelectionText("");
    setSelectionPos(null);
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

    // Fetch dictionary for single words in parallel with translation
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
    setSelectionPos(null);
    window.getSelection()?.removeAllRanges();

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          context: selectionContextRef.current || undefined,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setTranslateError(result.error || "翻译失败，请重试。");
        return;
      }

      setTranslateData(result.data);
    } catch (fetchError) {
      console.error(fetchError);
      setTranslateError("网络请求失败，请检查网络连接。");
    } finally {
      setTranslateLoading(false);
    }

    // Ensure dictionary fetch completes
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
    if (!selectionText.trim()) {
      window.alert("请先选择文本再收藏。");
      return;
    }
    setFavoriteDefaults({
      text: selectionText,
      sourceSentence: findSourceSentence(selectionText),
    });
    setFavoriteOpen(true);
    setSelectionText("");
    setSelectionPos(null);
    window.getSelection()?.removeAllRanges();
  }

  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
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
      const context = parentEl?.textContent?.trim() || "";

      setSelectionText(text);
      selectionContextRef.current = context;
      setSelectionPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    }, 10);
  }, []);

  async function handleDelete() {
    const confirmed = window.confirm(`确定删除语料「${material.title}」吗？该操作不可恢复。`);
    if (!confirmed) return;

    const result = await deleteMaterial(material.id);
    if (!result.ok) {
      window.alert(result.message);
      return;
    }

    router.push(`/library?categoryId=${material.categoryId}`);
    router.refresh();
  }

  return (
    <main className="space-y-6" ref={containerRef} onMouseUp={handleMouseUp}>
      <section className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Button type="button" variant="ghost" className="mb-2 px-0" onClick={() => router.push("/library")}>
            ← 返回场景库
          </Button>
          <h1 className="break-words text-2xl font-semibold">{material.title}</h1>
          <p className="mt-2 break-words text-sm text-muted-foreground">
            所属分类：{material.category.name} · 创建于 {formatDateTime(material.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <MaterialFormDialog
            mode="edit"
            categoryId={material.categoryId}
            material={material}
            trigger={<Button variant="secondary">编辑</Button>}
          />
          <MoveMaterialDialog
            materialId={material.id}
            currentCategoryId={material.categoryId}
            categories={categories}
            trigger={<Button variant="outline">移动</Button>}
          />
          <Button variant="destructive" onClick={handleDelete}>
            删除
          </Button>
        </div>
      </section>

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

{contentType === "sentence" ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="min-w-0 break-words">核心语料</CardTitle>
              <div className="flex min-w-0 flex-wrap gap-2">
                <Badge variant="outline" className="shrink-0">难度 {material.difficulty}</Badge>
                {material.scene ? <Badge variant="secondary" className="max-w-full break-words">{material.scene}</Badge> : null}
                {material.level ? <Badge variant="secondary" className="max-w-full break-words">{material.level}</Badge> : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {material.zh?.trim() ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">中文</p>
                <div className="break-words whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-7">
                  {material.zh}
                </div>
              </div>
            ) : null}
            {material.en?.trim() ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">英文</p>
                  <SegmentPlayButton onClick={() => handlePlaySegment(material.en)} />
                </div>
                <div className="break-words whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-7">
                  {material.en}
                </div>
              </div>
            ) : null}
            {material.usage ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">使用说明</p>
                <p className="break-words whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{material.usage}</p>
              </div>
            ) : null}
            {material.note ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">备注</p>
                <p className="break-words whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{material.note}</p>
              </div>
            ) : null}
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium">标签</p>
              <MaterialTagEditor materialId={material.id} tags={material.tags} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex flex-col gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <CardTitle className="min-w-0 break-words">{CONTENT_TYPE_LABELS[contentType] || contentType}</CardTitle>
                <Badge variant="outline" className="shrink-0">难度 {material.difficulty}</Badge>
                {material.scene ? <Badge variant="secondary" className="max-w-full break-words">{material.scene}</Badge> : null}
                {material.level ? <Badge variant="secondary" className="max-w-full break-words">{material.level}</Badge> : null}
              </div>
              {uniqueSpeakers.length > 0 ? (
                <div className="flex min-w-0 flex-wrap gap-1">
                  {uniqueSpeakers.map((role) => (
                    role ? (
                      <Badge key={role.name} variant="outline" className="max-w-full break-words text-xs">
                        {role.name}
                      </Badge>
                    ) : null
                  ))}
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {material.usage ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">使用说明</p>
                <p className="break-words whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{material.usage}</p>
              </div>
            ) : null}
            {material.note ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">备注</p>
                <p className="break-words whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{material.note}</p>
              </div>
            ) : null}
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium">标签</p>
              <MaterialTagEditor materialId={material.id} tags={material.tags} />
            </div>
          </CardContent>
        </Card>
      )}

      <MaterialVariantList materialId={material.id} variants={material.variants} />

      {contentType !== "sentence" && segments.length > 0 ? (
        <SegmentsDisplay
          contentType={contentType}
          segments={segments}
          onPlaySegment={handlePlaySegment}
        />
      ) : null}

      {selectionText && selectionPos ? (
        <>
          <div
            className="fixed z-50 hidden -translate-x-1/2 -translate-y-full gap-1 sm:flex"
            style={{ left: selectionPos.x, top: selectionPos.y }}
          >
            <Button
              type="button"
              size="sm"
              className="shadow-lg"
              onClick={handlePlaySelection}
            >
              播放选区
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="shadow-lg"
              onClick={handleTranslateSelection}
            >
              翻译选区
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shadow-lg"
              onClick={handleFavoriteSelection}
            >
              收藏
            </Button>
          </div>
          <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] sm:hidden">
            <div className="mx-auto flex max-w-sm items-center justify-center gap-1 rounded-full border bg-background px-2 py-1.5 shadow-lg">
              <Button type="button" size="sm" className="min-h-9 flex-1 px-2" onClick={handlePlaySelection}>
                朗读
              </Button>
              <Button type="button" size="sm" className="min-h-9 flex-1 px-2" onClick={handleTranslateSelection}>
                翻译
              </Button>
              <Button type="button" size="sm" variant="outline" className="min-h-9 flex-1 px-2" onClick={handleFavoriteSelection}>
                收藏
              </Button>
            </div>
          </div>
        </>
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
        favoriteTrigger={
          translateData ? (
            <FavoriteButton
              materialId={material.id}
              defaultText={translateSource}
              defaultType="phrase"
              defaultMeaning={translateData.chineseMeaning}
              defaultNote={`${translateData.explanation}\n\n${translateData.usage}`}
              sourceSentence={translateSource}
              label="收藏该表达"
            />
          ) : undefined
        }
      />
    </main>
  );
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  monologue: "独白 / 自述",
  dialogue: "对话",
  article: "短文",
  interview: "访谈",
  ielts: "雅思语料",
};

const SEGMENT_TYPE_LABELS: Record<string, string> = {
  paragraph: "段落",
  line: "对话行",
  qa: "问答",
};

function SegmentsDisplay({
  contentType,
  segments,
  onPlaySegment,
}: {
  contentType: string;
  segments: MaterialDetailType["segments"];
  onPlaySegment: (en: string, speaker?: string) => void;
}) {
  const label = CONTENT_TYPE_LABELS[contentType] || contentType;

  if (contentType === "dialogue") {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {segments.map((seg) => (
              <div
                key={seg.id}
                className="space-y-2 rounded-xl bg-muted/30 p-3"
              >
                <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                  {seg.speaker ? (
                    <Badge variant="secondary" className="min-w-0 max-w-[60%] break-words text-xs">
                      {seg.speaker}
                    </Badge>
                  ) : null}
                  <span className="min-w-0 flex-1 break-words">
                    {SEGMENT_TYPE_LABELS[seg.segmentType] || seg.segmentType} {seg.order + 1}
                  </span>
                  <SegmentPlayButton onClick={() => onPlaySegment(seg.en, seg.speaker || undefined)} />
                </div>
                <p className="break-words whitespace-pre-wrap text-sm leading-7">
                  {seg.en}
                </p>
                <p className="break-words whitespace-pre-wrap border-l-2 border-muted pl-3 text-sm leading-7 text-muted-foreground">
                  {seg.zh}
                </p>
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
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {segments.map((seg) => (
            <div key={seg.id} className="space-y-2">
              <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                <span className="min-w-0 flex-1 break-words">
                  {SEGMENT_TYPE_LABELS[seg.segmentType] || seg.segmentType}{" "}
                  {seg.order + 1}
                </span>
                {seg.speaker ? (
                  <Badge variant="outline" className="min-w-0 max-w-[60%] break-words text-xs">
                    {seg.speaker}
                  </Badge>
                ) : null}
                <SegmentPlayButton onClick={() => onPlaySegment(seg.en, seg.speaker || undefined)} />
              </div>
              <div className="break-words whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-7">
                {seg.en}
              </div>
              <p className="break-words whitespace-pre-wrap border-l-2 border-muted pl-2 text-sm leading-7 text-muted-foreground">
                {seg.zh}
              </p>
              {seg.note ? (
                <p className="text-xs text-muted-foreground/70 pl-2">{seg.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
