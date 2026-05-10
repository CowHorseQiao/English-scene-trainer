# Codex UI Polish Report

日期：2026-05-10

## 1. 修改摘要

本轮只做 UI polish：压缩首页和训练页筛选控件密度、优化复习页“全部收藏”管理按钮、统一基础控件圆角和卡片层级，并做少量自然文案调整。未修改 schema、API route、AI/TTS/FSRS/训练评分逻辑，也未新增依赖。

## 2. 修改文件列表

- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/textarea.tsx`
- `src/features/materials/material-feed.tsx`
- `src/features/materials/material-feed-card.tsx`
- `src/features/training/material-selector.tsx`
- `src/features/training/practice-setup.tsx`
- `src/features/review/review-card.tsx`
- `src/features/review/review-list.tsx`
- `src/features/review/due-review-session.tsx`
- `src/features/categories/category-tree.tsx`
- `src/features/materials/category-materials-panel.tsx`
- `src/features/materials/material-reader.tsx`
- `src/features/materials/material-detail.tsx`
- `src/features/training/cloze-practice.tsx`
- `src/features/training/zh-to-en-practice.tsx`
- `src/features/training/practice-result.tsx`
- `src/features/ai/generate-form.tsx`
- `src/features/importer/import-json-form.tsx`
- `docs/CODEX_UI_POLISH_REPORT.md`

## 3. 首页筛选控件优化

- 将首页排序、类型、分类筛选放入轻量圆角容器。
- Select 控件改为紧凑宽度，桌面端并排，手机端 flex-wrap 自动换行。
- 保留原有 URL searchParams、筛选逻辑和语料卡片点击进入阅读页行为。
- 语料卡片增加 rounded-2xl、轻量 shadow 和 hover 层级。

## 4. 训练页控件优化

- 训练语料筛选区改为紧凑圆角容器，分类、类型、排序尽量并排。
- 移动端控件不再默认占满整行，宽度不足时自然换行。
- 训练模式选择改为更紧凑的 segmented/chip 风格，按钮保持可触控高度。
- 训练题、提交、评分区域只调整样式和圆角，未改训练逻辑或评分逻辑。

## 5. 复习页全部收藏按钮优化

- 在“全部收藏”管理区域中，显示释义、编辑、删除三个按钮优先同排显示。
- 手机端使用 flex-wrap，极窄屏会自然换行，不横向溢出。
- 删除按钮保留 destructive 样式，确认删除流程不变。
- 今日复习和明日复习逻辑未修改。

## 6. 页面圆角和视觉美化

- 基础 `Card` 默认改为 rounded-xl + shadow-sm。
- 基础 `Button`、`Input`、`Textarea`、`Select` 默认改为更柔和圆角。
- 首页卡片、训练卡片、复习卡片、阅读 segment 卡片、分类卡片统一到 rounded-xl / rounded-2xl。
- 筛选区使用轻量 `border + bg-muted/20 + shadow-sm`，没有加入大面积渐变或复杂动画。

## 7. 文案调整

- AI 生成说明从“AI 会生成语料草稿”改为“生成一份可编辑的草稿”。
- JSON 导入说明改为“粘贴 JSON，先校验再导入”。
- 导入输入占位从“AI 生成的 JSON”收敛为“JSON”。
- 部分加载文案使用更短表达，如“正在加载语料…”。

## 8. build / lint 结果

- `npm run build`：通过。
- `npm run lint`：通过，剩余 2 个既有 warning：
  - `src/features/materials/tts-providers.ts`：`_voiceType` 未使用，TTS provider internals 本轮不改。
  - `src/features/training/training-session.tsx`：`useMemo` 依赖 warning，涉及旧训练会话逻辑，本轮不改。

## 9. 手动验收页面

- `/debug/mobile`
- `/`
- `/train`
- `/review`
- `/read/[id]`
- `/add`
- `/library`

手机端请使用 `npm run mobile:test` 做 production 模式验收，不要只看 dev 模式。

