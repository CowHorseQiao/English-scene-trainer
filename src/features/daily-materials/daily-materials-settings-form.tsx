"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { runDailyGenerationAction, saveDailyGenerationSettingAction } from "./actions";
import type { DailyGenerationSettingView } from "./types";

type Props = {
  setting: DailyGenerationSettingView;
  pendingDraftCount: number;
};

const PAUSE_MESSAGE = "待审核语料已达到上限。先处理一些草稿后再生成。";

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function DailyMaterialsSettingsForm({ setting, pendingDraftCount }: Props) {
  const [form, setForm] = useState(setting);
  const [isSaving, startSaving] = useTransition();
  const [isGenerating, startGenerating] = useTransition();
  const isPaused = pendingDraftCount >= form.maxPendingDrafts;

  function update<K extends keyof DailyGenerationSettingView>(
    key: K,
    value: DailyGenerationSettingView[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startSaving(async () => {
      const result = await saveDailyGenerationSettingAction(form);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function generate() {
    if (isPaused) {
      toast.error(PAUSE_MESSAGE);
      return;
    }

    startGenerating(async () => {
      const result = await runDailyGenerationAction();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>每日语料设置</CardTitle>
        <CardDescription>让系统每天帮你补充一点新输入。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => update("enabled", event.target.checked)}
            />
            <span>开启每日语料</span>
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground">生成时间</span>
            <Input
              value={form.generateTime}
              onChange={(event) => update("generateTime", event.target.value)}
              placeholder="08:00"
            />
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground">最大待审核</span>
            <Input
              type="number"
              min={1}
              max={100}
              value={form.maxPendingDrafts}
              onChange={(event) => update("maxPendingDrafts", toNumber(event.target.value, 10))}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["totalCount", "总数"],
            ["dialogueCount", "对话"],
            ["monologueCount", "独白"],
            ["interviewCount", "访谈"],
            ["articleCount", "文章"],
            ["ieltsCount", "IELTS"],
          ].map(([key, label]) => (
            <label key={key} className="space-y-1">
              <span className="text-muted-foreground">{label}</span>
              <Input
                type="number"
                min={key === "totalCount" ? 1 : 0}
                max={10}
                value={form[key as keyof DailyGenerationSettingView] as number}
                onChange={(event) =>
                  update(
                    key as keyof DailyGenerationSettingView,
                    toNumber(event.target.value, key === "totalCount" ? 1 : 0) as never,
                  )
                }
              />
            </label>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2">
            <input
              type="checkbox"
              checked={form.allowSuggestCategory}
              onChange={(event) => update("allowSuggestCategory", event.target.checked)}
            />
            <span>允许建议新分类</span>
          </label>
          <label className="flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2">
            <input
              type="checkbox"
              checked={form.autoImport}
              onChange={(event) => update("autoImport", event.target.checked)}
            />
            <span>自动入库（第一版暂不执行）</span>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-muted-foreground">当前学习目标</span>
            <Textarea
              value={form.learningGoal}
              onChange={(event) => update("learningGoal", event.target.value)}
              placeholder="例如：项目沟通、面试追问、日常表达"
            />
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground">近期重点</span>
            <Textarea
              value={form.focusNote}
              onChange={(event) => update("focusNote", event.target.value)}
              placeholder="例如：补充会议推进和风险说明"
            />
          </label>
        </div>

        {isPaused ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            {PAUSE_MESSAGE}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={save} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存设置"}
          </Button>
          <Button type="button" variant="outline" onClick={generate} disabled={isGenerating || isPaused}>
            {isGenerating ? "生成中..." : "立即生成一次"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
