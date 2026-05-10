# 数据库表说明

## 总览

数据库使用 SQLite，通过 Prisma ORM 管理。共 7 张业务表 + 1 张设置表。

---

## 表详情

### Category — 分类

存储英语学习场景的树形分类结构。

| 字段 | 说明 | 后续可能扩展 |
|---|---|---|
| `id` | cuid 主键 | — |
| `parentId` | 父分类 ID（null = 根分类） | — |
| `name` | 分类名称，如"保研英语面试" | — |
| `description` | 分类描述 | — |
| `sortOrder` | 同级排序序号 | 可能需要拖拽排序 |
| `createdAt` / `updatedAt` | 时间戳 | — |

**关系**:
- 自引用：`parentId` → `id`（一对多，构成树）
- `Category` 1──N `Material`（一个分类下有多个语料）

---

### Material — 语料

核心数据表。一条语料 = 一个中英对照表达。

| 字段 | 说明 | 后续可能扩展 |
|---|---|---|
| `id` | cuid 主键 | — |
| `categoryId` | 所属分类 | — |
| `title` | 标题，如"介绍项目分工" | — |
| `zh` | 中文原文 | 未来可支持纯英文场景（zh 可为空） |
| `en` | 英文原文 | — |
| `scene` | 场景标签，如"保研英语面试" | 可能改为多标签 |
| `level` | 难度等级，如"B2"、"C1" | 可增加 CEFR 标准校验 |
| `note` | 通用备注 | — |
| `usage` | 使用场景说明 | — |
| `difficulty` | 数字难度 1-5 | — |
| `isArchived` | 是否归档（软删除） | — |
| `createdAt` / `updatedAt` | 时间戳 | — |

**关系**:
- `Material` N──1 `Category`
- `Material` 1──N `MaterialVariant`（替代表达）
- `Material` N──N `Tag`（通过 `MaterialTag`）
- `Material` 1──N `TrainingRecord`
- `Material` 1──N `Favorite`

---

### MaterialVariant — 替代表达

一条语料的同义替换版本。例如同一句话更正式/更口语的表达。

| 字段 | 说明 | 后续可能扩展 |
|---|---|---|
| `id` | cuid 主键 | — |
| `materialId` | 所属语料 | — |
| `type` | 类型标签，如"natural"、"formal"、"casual" | 可改为枚举值 |
| `text` | 替代表达内容 | — |
| `note` | 备注说明 | — |
| `createdAt` | 时间戳 | — |

**关系**:
- `MaterialVariant` N──1 `Material`（Cascade 删除）

---

### Tag / MaterialTag — 标签

多对多标签系统，用于给语料打标签（如"项目经历"、"面试高频"）。

| 字段 | 说明 |
|---|---|
| `id` | cuid 主键 |
| `name` | 标签名称（唯一） |
| `createdAt` | 时间戳 |

**MaterialTag 关联表**:

| 字段 | 说明 |
|---|---|
| `materialId` + `tagId` | 联合唯一，防止重复关联 |

**关系**:
- `Tag` 1──N `MaterialTag` ← N──1 `Material`

---

### Favorite — 收藏

用户收藏的单词、短语、句型、句子或自定义片段。也是间隔复习的数据源。

| 字段 | 说明 | 后续可能扩展 |
|---|---|---|
| `id` | cuid 主键 | — |
| `materialId` | 来源语料（可为空，允许独立收藏） | — |
| `text` | 收藏的文字内容 | — |
| `type` | 类型：word/phrase/pattern/sentence/custom | 可扩展类型 |
| `meaning` | 中文释义 | — |
| `note` | 备注 | — |
| `sourceSentence` | 来源上下文句子 | — |
| `reviewStage` | 复习阶段（0-5） | 可能需要更复杂的算法参数 |
| `mastery` | 掌握程度（当前未使用） | 未来可用于自定义复习策略 |
| `nextReviewAt` | 下次复习时间 | — |
| `lastReviewAt` | 上次复习时间 | — |
| `createdAt` / `updatedAt` | 时间戳 | — |

**关系**:
- `Favorite` N──1 `Material`（SetNull 删除策略）
- `Favorite` 1──N `ReviewLog`

---

### ReviewLog — 复习日志

每次复习操作的记录，用于追踪历史表现。

| 字段 | 说明 |
|---|---|
| `id` | cuid 主键 |
| `favoriteId` | 复习的收藏项 |
| `result` | 结果：known / unclear / unknown |
| `createdAt` | 复习时间 |

**关系**:
- `ReviewLog` N──1 `Favorite`（Cascade 删除）

---

### TrainingRecord — 训练记录

每次训练会话的题目记录。

| 字段 | 说明 | 后续可能扩展 |
|---|---|---|
| `id` | cuid 主键 | — |
| `materialId` | 训练的语料 | — |
| `type` | 训练模式：cloze / zh_to_en | 可扩展新模式 |
| `prompt` | 题目文本（挖空句子或中文原文） | — |
| `userAnswer` | 用户答案 | — |
| `referenceAnswer` | 参考答案 | — |
| `isCorrect` | 是否答对（仅 cloze 有自动判断） | — |
| `selfRating` | 自评：easy/normal/hard/forgot | — |
| `createdAt` | 训练时间 | — |

**关系**:
- `TrainingRecord` N──1 `Material`（Cascade 删除）
- 索引：(materialId, type, createdAt)

---

### ImportBatch — 导入批次

记录每次 JSON 批量导入的信息。

| 字段 | 说明 |
|---|---|
| `id` | cuid 主键 |
| `categoryId` | 导入目标分类 |
| `title` | 批次标题（来自 JSON） |
| `source` | 来源描述（来自 JSON） |
| `rawJson` | 原始 JSON 内容 |
| `itemCount` | 导入语料数量 |
| `createdAt` | 导入时间 |

---

### AppSetting — 应用设置

简单的 KV 设置表（当前未使用）。

| 字段 | 说明 |
|---|---|
| `key` | 设置键（主键） |
| `value` | 设置值 |
| `updatedAt` | 更新时间 |

---

## 表关系图（文字版）

```
Category ──1:N── Material ──1:N── MaterialVariant
                     │
                     ├──N:N── Tag (via MaterialTag)
                     │
                     ├──1:N── TrainingRecord
                     │
                     └──1:N── Favorite ──1:N── ReviewLog
```

## 删除策略

| 关系 | 删除策略 | 说明 |
|---|---|---|
| Category → Material | Restrict | 有语料的分类不能删 |
| Material → MaterialVariant | Cascade | 删语料同时删变体 |
| Material → TrainingRecord | Cascade | 删语料同时删训练记录 |
| Material → Favorite | SetNull | 删语料保留收藏（设为无来源） |
| Favorite → ReviewLog | Cascade | 删收藏同时删复习日志 |
| Tag → MaterialTag | Cascade | 删标签同时删关联 |
| Material → MaterialTag | Cascade | 删语料同时删标签关联 |
