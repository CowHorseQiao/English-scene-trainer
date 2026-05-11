# AI 每日语料

## 功能说明

“每日语料”在 `/add` 页面提供第三个 Tab。它会根据现有分类、语料标题、内容类型分布和最近语料元信息，让 DeepSeek 生成一批新语料草稿。

第一版默认不会直接写入正式语料库。生成结果会进入待审核列表，用户可以预览、接受入库或拒绝。

## 设置项

- `enabled`：是否允许内部 API 执行每日生成。
- `generateTime`：计划生成时间，第一版只保存，不在应用内启动定时器。
- `totalCount`：每次生成总数。
- `dialogueCount` / `monologueCount` / `interviewCount` / `articleCount` / `ieltsCount`：不同类型的期望数量。
- `allowSuggestCategory`：接受入库时，如果草稿分类不存在，是否自动创建分类路径。
- `autoImport`：字段已保留，第一版仍走待审核流程。
- `maxPendingDrafts`：待审核草稿上限，默认 10。
- `learningGoal`：当前学习目标。
- `focusNote`：近期生成重点。

## 待审核上限

所有生成入口都会先检查：

```txt
pendingDraftCount >= maxPendingDrafts
```

达到上限时：

- 不调用 DeepSeek；
- 创建一条 `DailyGenerationBatch`，状态为 `skipped`；
- `reason` 记录为 `pending_limit_reached`；
- 页面提示：待审核语料已达到上限。先处理一些草稿后再生成。

## 手动生成

进入 `/add`，打开“每日语料”Tab：

1. 保存设置；
2. 点击“立即生成一次”；
3. 在待审核列表中预览草稿；
4. 点击“接受入库”或“拒绝”。

接受入库后会创建正式 `Material`、`MaterialSegment`、`MaterialVariant` 和 Tag 关联。

## 内部 API

后续服务器 cron 可以调用：

```bash
curl -X POST https://your-domain.com/api/daily-materials/run \
  -H "Authorization: Bearer $DAILY_JOB_SECRET"
```

要求：

- 只支持 `POST`；
- 必须配置 `DAILY_JOB_SECRET`；
- Header 必须是 `Authorization: Bearer <DAILY_JOB_SECRET>`；
- token 错误返回 `401`；
- `enabled=false` 时返回 skipped；
- 待审核达到上限时返回 skipped。

## Ubuntu Cron 示例

每天早上 8 点运行：

```cron
0 8 * * * DAILY_JOB_SECRET="replace-with-your-secret" curl -X POST https://your-domain.com/api/daily-materials/run -H "Authorization: Bearer $DAILY_JOB_SECRET"
```

也可以把 secret 放到服务器环境变量或单独的 env 文件里，避免写进命令历史。

## 为什么默认待审核

每日生成是持续写入型功能。如果默认自动入库，语料库很容易被低质量或重复内容污染。第一版采用待审核流程，可以先看标题、分类、正文和标签，再决定是否入库。

## 部署注意

部署前需要配置：

- `DEEPSEEK_API_KEY`
- `DAILY_JOB_SECRET`

不要把真实 token 写进仓库。生产环境如果没有 `DAILY_JOB_SECRET`，内部 API 会拒绝运行。
