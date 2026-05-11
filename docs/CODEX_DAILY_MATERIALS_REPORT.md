# CODEX Daily Materials Report

## 修改摘要

实现“AI 每日语料”第一版：`/add` 新增“每日语料”Tab，可保存设置、手动生成草稿、查看待审核数量、预览草稿、接受入库、拒绝草稿，并新增带 Bearer token 鉴权的内部 API 供 cron 调用。

## 新增文件

- `src/features/daily-materials/actions.ts`
- `src/features/daily-materials/queries.ts`
- `src/features/daily-materials/schemas.ts`
- `src/features/daily-materials/types.ts`
- `src/features/daily-materials/daily-materials-utils.ts`
- `src/features/daily-materials/daily-materials-generator.ts`
- `src/features/daily-materials/daily-materials-settings-form.tsx`
- `src/features/daily-materials/daily-materials-draft-list.tsx`
- `src/features/daily-materials/daily-materials-batch-card.tsx`
- `src/features/daily-materials/daily-materials-tab.tsx`
- `src/app/api/daily-materials/run/route.ts`
- `prisma/migrations/20260511000000_add_daily_materials/migration.sql`
- `docs/DAILY_MATERIALS.md`

## 修改文件

- `prisma/schema.prisma`
- `.env.example`
- `src/app/add/page.tsx`

## 数据库迁移说明

新增模型：

- `DailyGenerationSetting`
- `DailyGenerationBatch`
- `DailyGeneratedMaterialDraft`

已运行：

- `npx prisma validate`：通过
- `npx prisma generate`：通过

本地执行 `npx prisma migrate dev --name add_daily_materials` 时检测到现有 SQLite 数据库存在 migration drift：数据库里有 `20260510023356_add_fsrs_review_fields`，但当前 `prisma/migrations` 目录缺少该迁移文件。为避免 Prisma 提示 reset 导致数据丢失，本次没有重置数据库。已保留手写迁移 SQL，并对当前本地 `dev.db` 非破坏性执行了新增表 SQL。

部署前建议先补齐缺失迁移历史，或在干净数据库上按当前 migration 目录执行迁移。

## 新增环境变量

- `DAILY_JOB_SECRET=`

`DEEPSEEK_API_KEY` 仍用于 DeepSeek 调用。不要提交真实值。

## 如何手动测试

1. 打开 `/add`。
2. 进入“每日语料”Tab。
3. 保存设置。
4. 点击“立即生成一次”。
5. 确认草稿进入待审核列表，没有直接进入正式语料库。
6. 预览草稿。
7. 点击“接受入库”，在 `/library` 查看正式语料。
8. 对另一篇草稿点击“拒绝”，确认不会创建正式语料。
9. 把 `maxPendingDrafts` 设置为当前 pending 数量或更低，确认生成按钮暂停，后端不会调用 DeepSeek。

## Cron 触发

```bash
curl -X POST https://your-domain.com/api/daily-materials/run \
  -H "Authorization: Bearer $DAILY_JOB_SECRET"
```

API 行为：

- token 错误：`401`
- 未开启每日语料：`skipped`
- 待审核达到上限：`skipped`
- 正常生成：草稿进入待审核列表

## 第一版未做

- 没有内置定时器进程。
- `generateTime` 只保存，不由应用自动调度。
- `autoImport` 字段和 UI 已保留，但第一版仍然进入待审核流程。
- 没有修改现有 AI 一键生成、JSON 导入、TTS、FSRS 或训练评分逻辑。

## 验证结果

- `npx prisma validate`：通过
- `npx prisma generate`：通过
- `npm run build`：通过
- `npm run lint`：通过；保留 2 个既有 warning：
  - `src/features/materials/tts-providers.ts` 中 `_voiceType` 未使用
  - `src/features/training/training-session.tsx` 中 `useMemo` 依赖提示

## 手动验收清单

- `npm run mobile:test`
- `/debug/mobile`
- `/add`
- `/library`
- `/read/[id]`
- `/train`
- `/review`
