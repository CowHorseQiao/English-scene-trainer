# 模块说明

## 架构总览

项目使用 **feature-based 模块化架构**。每个 feature 是一个业务领域，包含自己的数据读取、数据写入、类型定义和 React 组件。页面（`src/app/`）负责路由和组合，feature 模块负责业务逻辑。

```
src/
  app/          — 路由页面（整合多个 feature）
  features/     — 业务模块（独立内聚）
  components/   — 通用 UI 和布局
  lib/          — 基础设施（数据库、工具函数）
```

---

## features 模块

### categories — 分类树管理

**职责**: 管理英语学习场景的分类树。分类相当于文件夹，可以嵌套。

**主要文件**:

| 文件 | 职责 |
|---|---|
| `queries.ts` | 读取分类数据（扁平列表、树、单个） |
| `actions.ts` | 增删改分类 + 移动分类到其他父节点 |
| `types.ts` | `CategoryFlatNode`、`CategoryTreeNode`、输入/输出类型 |
| `utils.ts` | 树构建、遍历、查找、路径拼接等纯函数 |
| `category-tree.tsx` | 分类树主面板（左侧树 + 右侧详情） |
| `category-tree-node.tsx` | 递归树节点组件（展开/折叠、操作按钮） |
| `category-form-dialog.tsx` | 新建/编辑分类的弹窗表单 |

**页面入口**: `src/app/library/page.tsx`

---

### materials — 语料管理

**职责**: 管理每一条中英对照语料（标题、中文、英文、场景标签等）。

**主要文件**:

| 文件 | 职责 |
|---|---|
| `queries.ts` | 按分类读取语料列表、按 ID 读取详情 |
| `actions.ts` | 增删改语料 + 移动分类 + 管理替代表达和标签 |
| `types.ts` | `MaterialListItem`、`MaterialDetail`、输入输出类型 |
| `category-materials-panel.tsx` | 嵌入分类页的语料列表面板 |
| `material-card.tsx` | 语料卡片展示 |
| `material-detail.tsx` | 语料详情页主组件 |
| `material-form-dialog.tsx` | 新建/编辑语料的弹窗表单 |
| `material-tag-editor.tsx` | 语料标签添加/删除交互 |
| `material-variant-list.tsx` | 替代表达列表 + 添加表单 |
| `move-material-dialog.tsx` | 移动语料到其他分类的弹窗 |

**页面入口**: `src/app/library/page.tsx`（列表）、`src/app/library/material/[id]/page.tsx`（详情）

---

### importer — JSON 批量导入

**职责**: 将 AI 生成的结构化 JSON 批量导入语料。支持客户端校验预览 + 服务端事务写入。

**主要文件**:

| 文件 | 职责 |
|---|---|
| `schemas.ts` | Zod schema（定义 JSON 结构并校验） |
| `types.ts` | 导入结果类型 + 分类选择类型 |
| `actions.ts` | 服务端导入逻辑（事务写入） |
| `import-json-form.tsx` | 导入页主表单（JSON 编辑器 + 校验按钮） |
| `import-preview.tsx` | 校验成功后显示语料预览 |
| `sample-json.ts` | 示例 JSON 数据 |

**页面入口**: `src/app/import/page.tsx`

---

### training — 训练

**职责**: 提供挖空补全（cloze）和中译英（zh_to_en）两种训练模式。

**主要文件**:

| 文件 | 职责 |
|---|---|
| `queries.ts` | 读取训练分类选项、按条件获取训练语料 |
| `actions.ts` | 保存训练记录 |
| `types.ts` | 训练模式、语料、题目、记录等类型 |
| `utils.ts` | 挖空算法、答案标准化、分类收集、Shuffle |
| `training-session.tsx` | 训练主流程管理（题目切换、提交、自评） |
| `training-setup-form.tsx` | 训练参数设置表单 |
| `cloze-trainer.tsx` | 挖空补全题目的输入区域 |
| `zh-to-en-trainer.tsx` | 中译英题目的输入区域 |
| `training-result.tsx` | 提交后展示参考答案 + 自评按钮 |

**页面入口**: `src/app/train/page.tsx`

---

### favorites — 收藏

**职责**: 收藏单词、短语、句型、完整句子或自定义片段，作为后续复习的素材。

**主要文件**:

| 文件 | 职责 |
|---|---|
| `queries.ts` | 读取收藏列表和单个收藏项 |
| `actions.ts` | 增删改收藏项 |
| `types.ts` | `FavoriteType`、`FavoriteInfo`、输入输出类型 |
| `favorite-button.tsx` | 快捷收藏按钮（分散在各页面） |
| `favorite-card.tsx` | 收藏项卡片展示 |
| `favorite-form-dialog.tsx` | 新建/编辑收藏的弹窗表单 |
| `favorite-list.tsx` | 收藏列表容器 |

**注意**: 收藏的"查看"和"复习"在 review 模块。

---

### review — 间隔复习

**职责**: 基于简化版 SM 算法对收藏项进行间隔重复复习。

**主要文件**:

| 文件 | 职责 |
|---|---|
| `queries.ts` | 读取复习面板数据（待复习/即将复习/全部） |
| `actions.ts` | 提交复习结果，更新间隔算法 |
| `types.ts` | `ReviewResult`、`ReviewFavorite`、`ReviewDashboardData` |
| `review-utils.ts` | 间隔算法（`getReviewUpdate`）、日期格式化 |
| `review-tabs.tsx` | 三栏 Tabs 容器（due / upcoming / all） |
| `review-card.tsx` | 复习卡片（显示释义、提交复习结果） |
| `review-list.tsx` | 复习列表容器 |

**页面入口**: `src/app/review/page.tsx`

---

## 页面与 feature 对应表

| 路由 | 页面文件 | 使用的主要 feature |
|---|---|---|
| `/` | `app/page.tsx` | 无（首页导航） |
| `/library` | `app/library/page.tsx` | categories + materials |
| `/library/material/[id]` | `app/library/material/[id]/page.tsx` | materials + categories + favorites |
| `/import` | `app/import/page.tsx` | importer |
| `/train` | `app/train/page.tsx` | training + favorites |
| `/review` | `app/review/page.tsx` | review + favorites |
| `/settings` | `app/settings/page.tsx` | 无（占位） |

---

## 数据流模式

项目统一使用以下数据流模式：

1. **服务端组件（RSC）** 在页面层直接调用 `queries.ts` 获取数据，传给客户端组件
2. **客户端组件（"use client"）** 通过 props 接收初始数据
3. **写操作** 使用 Server Actions（`actions.ts`），通过 `revalidatePath` 触发页面刷新
4. **例外**: `CategoryMaterialsPanel` 使用 Server Action 作为"读 API"（`useEffect` + `listMaterialsByCategoryAction`），这是早期模式，未来可改用 RSC
