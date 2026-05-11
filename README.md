# English Scene Trainer

一个面向个人英语学习的场景化语料训练 Web App。

它不是一个传统的背单词工具，而是围绕“中短篇场景语料”组织输入、阅读、朗读、收藏、复习和输出训练。你可以为自己的真实需求积累材料，例如保研英语面试、项目介绍、日常交流、雅思口语/写作等。

## 项目背景

很多英语学习工具的场景和内容比较固定，适合通用练习，但不一定贴合个人近期真正要表达的内容。English Scene Trainer 更偏向一个个人语料库：先围绕具体场景生成或导入中短篇材料，再在阅读、朗读、划词收藏和训练里反复使用这些材料。

项目目前主要服务个人学习流程，不是商业 SaaS，也没有多用户系统。

## 核心理念

这个项目围绕一个学习闭环设计：

```text
AI 生成语料
  -> 阅读 / 朗读
  -> 划词翻译
  -> 收藏表达
  -> 间隔复习
  -> 克漏字 / 中译英训练
  -> 继续生成更合适的语料
```

语料不是只保存零散句子，而是尽量保留场景、段落、speaker、中文释义、使用说明和标签，让后续复习和训练有上下文。

## 主要功能

### 场景化语料库

- 分类树管理，适合按学习目标或场景组织材料。
- 支持中短篇语料，不限于单句。
- 支持 `dialogue`、`monologue`、`interview`、`article`、`ielts` 等内容类型。
- 使用 `MaterialSegment` 保存分段内容，可记录段落类型、speaker、英文、中文和备注。
- 首页提供语料流，可按时间、分类和内容类型筛选。

### AI 生成语料

- 通过 DeepSeek API 根据主题、难度、长度、风格生成结构化语料。
- 固定 speaker 角色：`Tim`、`Dacey`、`Stokie`、`Tina`。
- 生成结果经过结构校验后再导入语料库。
- 支持 JSON 批量导入，适合从外部工具或手动整理的材料入库。
- `/add` 页面包含“每日语料”功能，可生成待审核草稿，再手动接受入库或拒绝。

### 阅读体验

- 专注阅读页：`/read/[id]`。
- 语料详情页：`/library/material/[id]`。
- 支持中英对照，并可显示 / 隐藏中文。
- 对话、独白、访谈、短文等类型会按 segment 结构展示。
- 选中文本后可进行朗读、翻译、收藏。

### TTS 朗读

- 支持浏览器内置 `speechSynthesis`。
- 支持火山引擎豆包 TTS，并将生成的 MP3 缓存在 `storage/audio-cache`。
- speaker 可对应不同音色。
- 支持全文朗读、单个 segment 朗读和选区朗读。
- 远程 TTS 可通过环境变量关闭，关闭后可退回浏览器朗读。

### 划词翻译与收藏

- 阅读时选中英文文本，可调用翻译接口查看中文释义、解释、用法和例句。
- 单词选区会额外尝试查询词典信息。
- 可收藏 `word`、`phrase`、`pattern`、`sentence`、`custom` 类型。
- 收藏项可记录来源语料和来源句子，方便复习时回到上下文。

### 训练模块

- 克漏字练习：基于语料生成填空题。
- 中译英练习：根据中文 segment 输入英文。
- 中译英支持 DeepSeek 评分，返回总分、分段评分、修改建议和更自然的表达。
- 训练记录会保存到本地数据库。

### 复习模块

- 收藏项会进入间隔重复复习流程。
- 支持今日复习、明日复习和全部收藏管理。
- 复习结果包括：认识、模糊、不认识。
- 当前实现使用 `reviewStage` 和 `nextReviewAt` 做阶段式调度。

### 移动端适配

- 针对 iPhone / 小屏做了基础适配。
- 移动端使用底部导航。
- 阅读、选区操作、训练和复习页面做了小屏交互调整。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- SQLite
- DeepSeek API
- Volcengine Doubao TTS
- MP3 audio cache
- PM2 / Nginx 可用于个人部署

## 项目结构

```text
src/
  app/                         Next.js App Router 页面和 API routes
  components/
    layout/                    桌面导航和移动端底部导航
    ui/                        shadcn/ui 组件
  features/
    ai/                        AI 生成语料
    categories/                分类树
    daily-materials/           每日语料草稿
    favorites/                 收藏表达
    importer/                  JSON 导入
    materials/                 语料展示、阅读、TTS
    review/                    间隔复习
    speakers/                  speaker 与音色映射
    training/                  克漏字和中译英训练
  lib/                         数据库连接、工具函数、音频缓存

prisma/
  schema.prisma                Prisma 数据模型
  migrations/                  SQLite 迁移

docs/                          开发说明和模块文档
storage/audio-cache/           TTS 音频缓存，本地生成，不应提交
```

## 本地运行

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd english-scene-trainer
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

项目提供 `.env.example`。本地可以复制为 `.env`：

```bash
cp .env.example .env
```

然后按需填写 DeepSeek 和火山引擎 TTS 配置。`.env` 不要提交到仓库。

### 4. 初始化数据库

```bash
npx prisma generate
npx prisma migrate dev
```

如果只是本地快速同步 schema，也可以参考 `docs/DEV_GUIDE.md` 使用：

```bash
npx prisma db push
```

### 5. 启动开发服务

```bash
npm run dev
```

默认访问：

```text
http://localhost:3000
```

## 可用脚本

```bash
npm run dev          # Next.js 开发模式
npm run build        # 生产构建
npm run start        # 启动生产服务
npm run lint         # ESLint
npm run mobile:test  # 构建通过后提示使用 production server 做手机端测试
```

## 环境变量

以下变量来自 `.env.example` 和当前代码使用情况，请只填写本地或服务器环境变量，不要提交真实值。

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | SQLite 连接地址，例如 `file:./dev.db` |
| `DEEPSEEK_API_KEY` | DeepSeek API key，用于生成、翻译和训练评分 |
| `DAILY_JOB_SECRET` | 调用每日语料内部 API 的 Bearer token |
| `NEXT_PUBLIC_TTS_PROVIDER` | TTS provider，支持 `browser` 或 `volcengine` |
| `ENABLE_REMOTE_TTS` | 是否启用服务端远程 TTS，火山引擎 TTS 需要设为 `true` |
| `VOLCENGINE_TTS_APP_ID` | 火山引擎 TTS App ID |
| `VOLCENGINE_TTS_ACCESS_TOKEN` | 火山引擎 TTS Access Token |
| `VOLCENGINE_TTS_CLUSTER` | 火山引擎 TTS cluster，默认示例为 `volcano_tts` |
| `VOLCENGINE_TTS_VOICE_TYPE` | 默认音色，speaker 音色未命中时使用 |

代码中还支持以下可选 TTS 参数：

| 变量 | 说明 |
| --- | --- |
| `VOLCENGINE_TTS_SPEED_RATIO` | 默认语速 |
| `VOLCENGINE_TTS_PITCH_RATIO` | 默认音高 |
| `VOLCENGINE_TTS_VOLUME_RATIO` | 默认音量 |
| `VOLCENGINE_TTS_RATE` | 音频采样率 |

## 移动端调试说明

Next dev 模式在部分局域网 / iPhone 场景下可能出现 HMR WebSocket 或连接判断问题。手机端验收建议使用 production build，不要只根据 `next dev` 判断移动端是否异常。

项目提供：

```bash
npm run mobile:test
npm run start
```

`mobile:test` 会先运行 `npm run build`，构建通过后再用 `npm run start` 启动 production server 测试。

如果需要让局域网内手机访问，可以使用 Next.js 的监听参数：

```bash
npx next start -H 0.0.0.0 -p 3000
```

然后在手机浏览器访问电脑的局域网 IP 和端口。

## 部署说明

个人部署时通常需要：

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

生产环境可以用 PM2 托管 Node.js 进程，再用 Nginx 做反向代理和 HTTPS。

需要特别注意备份：

- SQLite 数据库文件
- `storage/audio-cache` 中的 TTS 音频缓存
- 服务器环境变量

更细的部署和维护细节建议放在 `docs/` 中维护。

## 安全提醒

- 不要提交 `.env`、`.env.local` 或任何 secrets。
- 不要提交 SQLite 数据库文件。
- 不要提交 `storage/audio-cache` 音频缓存。
- DeepSeek 和火山引擎 key 只应在服务端使用。
- 每日语料内部 API 需要配置 `DAILY_JOB_SECRET`。
- 个人部署如果暴露到公网，建议加 Basic Auth、反向代理鉴权或其它访问控制。

## 适合谁

- 想围绕真实场景积累英语表达的人。
- 准备英语面试、保研面试或项目介绍的人。
- 想自己掌控语料库，而不是只使用固定课程的人。
- 想用 AI 辅助生成输入材料，并通过复习和训练反复使用的人。

## 后续可能方向

- 更细致的 AI 批改和反馈。
- 更稳定的每日语料生成策略。
- 更好的移动端阅读和训练交互。
- 多模型支持。
- 学习数据统计和趋势分析。
- PostgreSQL 支持。
- 多用户和权限控制。

## License

License 暂未指定。
