# Codex Final UI Fix Report

日期：2026-05-10

## 修改摘要

本轮只修部署前视觉 bug：长文本溢出和复习页 Tabs 垂直居中。未修改业务逻辑、路由、数据库、API、AI/TTS、FSRS 或训练评分。

## 修改文件

- `src/components/ui/tabs.tsx`
- `src/features/review/review-tabs.tsx`
- `src/features/review/review-card.tsx`
- `src/features/favorites/favorite-card.tsx`
- `src/features/favorites/favorite-list.tsx`
- `src/features/materials/material-card.tsx`
- `src/features/materials/material-feed-card.tsx`
- `src/features/materials/material-reader.tsx`
- `src/features/materials/material-detail.tsx`
- `src/features/training/material-selector.tsx`
- `docs/CODEX_FINAL_UI_FIX_REPORT.md`

## 修复内容

- 标题区增加 `min-w-0`、`flex-1`、`line-clamp` 和 `break-words`，避免长 title 撑破卡片。
- 难度、阶段、计数等 badge 增加 `shrink-0`，避免被长标题挤出容器。
- scene、level、category、source、summary、note 等长文本增加 `break-words`，避免横向溢出。
- tag 和 badge 列表保持 `flex-wrap`，长标签增加 `max-w-full break-words`。
- 阅读页和详情页的英文、中文、speaker 名称增加防溢出处理。
- 训练页语料选择卡增加长标题和长分类/scene 的防溢出处理。
- 复习页 TabsList/Trigger 统一 `min-h`、`h-9`、`p-1`、`items-center`、`rounded-xl`，让文字和选中背景上下居中。

## 验证结果

- `npm run build`：通过。
- `npm run lint`：通过，剩余 2 个既有 warning：
  - `src/features/materials/tts-providers.ts`：`_voiceType` 未使用。
  - `src/features/training/training-session.tsx`：`useMemo` 依赖 warning。

上述 warning 不属于本轮 UI bug 修复范围，未处理。

## 手动验收清单

- 使用 `npm run mobile:test` 做 iPhone production 验收。
- `/debug/mobile` 确认 Hydrated。
- `/` 检查首页长标题、难度 badge、scene/level/tags。
- `/read/[id]` 检查长标题、长英文、speaker、segment。
- `/library` 检查语料列表长标题和标签。
- `/train` 检查训练语料选择卡和筛选区。
- `/review` 检查 Tabs 上下居中，以及全部收藏长文本和按钮布局。

