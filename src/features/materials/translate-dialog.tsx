"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type TranslateData = {
  chineseMeaning: string;
  explanation: string;
  usage: string;
  example?: string;
};

type WordData = {
  ipa: string;
  audioUrl: string | null;
};

type TranslateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  error: string | null;
  sourceText: string;
  data: TranslateData | null;
  wordData: WordData | null;
  onPlayWord: ((audioUrl: string | null, text: string) => void) | null;
  favoriteTrigger?: ReactNode;
};

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2.5v11l9-5.5z" />
    </svg>
  );
}

export function TranslateDialog({
  open,
  onOpenChange,
  loading,
  error,
  sourceText,
  data,
  wordData,
  onPlayWord,
  favoriteTrigger,
}: TranslateDialogProps) {
  const isWord = wordData !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isWord ? sourceText : "翻译结果"}</DialogTitle>
          <DialogDescription>
            由 DeepSeek AI 提供翻译和解释。
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            正在翻译...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Word header with IPA and play button */}
            {isWord ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{wordData.ipa}</span>
                {onPlayWord ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="播放发音"
                    onClick={() => onPlayWord(wordData.audioUrl, sourceText)}
                  >
                    <PlayIcon />
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">原文</p>
                <p className="text-sm font-medium rounded-lg bg-muted/50 p-3 whitespace-pre-wrap">
                  {sourceText}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">中文意思</p>
              <p className="text-sm leading-relaxed">{data.chineseMeaning}</p>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">解释</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {data.explanation}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">使用说明</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {data.usage}
              </p>
            </div>

            {data.example ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">例句</p>
                <p className="text-sm italic rounded-lg bg-muted/50 p-3">
                  {data.example}
                </p>
              </div>
            ) : null}

            {favoriteTrigger ? (
              <div className="pt-2 flex justify-end">
                {favoriteTrigger}
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
