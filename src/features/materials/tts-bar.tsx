"use client";

import { Button } from "@/components/ui/button";

type TtsBarProps = {
  supported: boolean;
  speaking: boolean;
  paused: boolean;
  rate: number;
  providerName: string;
  onPlayFull: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRateChange: (rate: number) => void;
};

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2.5v11l9-5.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.5 2h2v12h-2zM9.5 2h2v12h-2z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="3" y="3" width="10" height="10" rx="1" />
    </svg>
  );
}

export function TtsBar({
  supported,
  speaking,
  paused,
  rate,
  providerName,
  onPlayFull,
  onPause,
  onResume,
  onStop,
  onRateChange,
}: TtsBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <span className="shrink-0">语速</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={(e) => onRateChange(Number(e.target.value))}
          className="h-2 min-w-0 flex-1 accent-primary sm:w-24 sm:flex-none"
          disabled={!supported}
        />
        <span className="text-xs tabular-nums w-8">{rate}x</span>
      </div>

      <div className="flex items-center gap-1">
        {speaking && !paused ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onPause}
            disabled={!supported}
            title="暂停"
          >
            <PauseIcon />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={speaking && paused ? onResume : onPlayFull}
            disabled={!supported}
            title={speaking && paused ? "继续" : "播放全文"}
          >
            <PlayIcon />
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onStop}
          disabled={!speaking}
          title="停止"
        >
          <StopIcon />
        </Button>
      </div>

      <span className="text-xs text-muted-foreground">
        {!supported
          ? "当前浏览器不支持朗读"
          : speaking
            ? (paused ? "已暂停" : "播放中")
            : "就绪"}
        {providerName ? ` · ${providerName}` : null}
      </span>
    </div>
  );
}

export function SegmentPlayButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-9 w-9 sm:h-7 sm:w-7 p-0"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title="播放此段"
    >
      <PlayIcon />
    </Button>
  );
}
