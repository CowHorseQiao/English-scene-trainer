# 开发 Backlog

优先级定义：
- **P0** — 阻塞体验或影响数据安全
- **P1** — 明显可改进，收益高
- **P2** — 值得做但不紧急
- **P3** — 未来功能或锦上添花

---

## P0 — 必须处理

### P0-1: 清理死依赖和空目录

- 移除 `@phosphor-icons/react` 和 `next-themes` 两个未使用的依赖
- 将 `shadcn` 从 `dependencies` 移到 `devDependencies`
- 删除三个空目录：`src/features/ai/`、`src/types/`、`src/components/common/`

**原因**: 保持项目整洁，减少 `npm install` 不必要的包，避免新人对空目录产生困惑。

### P0-2: 修复训练记录的 revalidatePath

`src/features/training/actions.ts:30` 调用了 `revalidatePath("/train")`，但 `/train` 页并不展示训练记录数据。这条 revalidation 每次训练后都会产生不必要的页面刷新。

**原因**: 无效的缓存刷新等价于无意义的数据库查询；如果未来 `/train` 增加数据展示，应等那时再加。

---

## P1 — 明显优化点

### P1-1: 缺 loading 和 error 边界

目前所有路由（`/library`、`/train`、`/review`、`/import`）都没有 `loading.tsx` 和 `error.tsx`：

- 服务端数据加载期间用户看到的是白屏
- 服务端组件抛出的异常会冒泡到根 error 页

**建议方案**: 为 `/library`、`/train`、`/review` 添加 `loading.tsx`（骨架屏）和 `error.tsx`（带重试按钮的边界）。

### P1-2: 分类路径构建逻辑重复

`src/app/import/page.tsx` 中 `getCategoryOptions()` 和 `src/features/training/utils.ts` 中 `buildCategoryOptions()` 本质上是同一件事：根据扁平的分类列表按 parentId 递归拼接路径字符串。

**建议方案**: 将路径构建逻辑提取到 `src/features/categories/utils.ts` 作为公共函数，两边分别调用。

### P1-3: Material 列表使用 server action 做读操作

`CategoryMaterialsPanel` 使用 `useEffect` + `listMaterialsByCategoryAction` 的模式加载语料列表，绕过了 RSC 的优势：

- 额外网络延迟（先渲染页面骨架，再触发 server action 返回数据）
- 无法享受 RSC 的流式渲染

**建议方案**: 将数据获取提升到父服务端组件，直接从 Prisma 查数据后作为 props 传入客户端组件。或者使用 Next.js 的 fetch 缓存。

### P1-4: 复习页查询无分页

`getReviewDashboardData()` 中 `due` 和 `all` 查询没有 `take` 限制。收藏项增多后可能导致：

- 内存占用持续增长
- 页面渲染压力大

**建议方案**: `due` 和 `all` 至少添加 `take: 500` 上限，后续可考虑增量加载。

---

## P2 — 值得优化

### P2-1: SQLite 配置 WAL 模式

`src/lib/db.ts` 没有配置任何 SQLite PRAGMA。SQLite 默认 `DELETE` 日志模式写开销大，配置 WAL 模式可以显著提升并发读性能（review 页面一次执行 3 个并行查询）。

**建议方案**: 在 Prisma 连接后执行 `PRAGMA journal_mode=WAL` 和 `PRAGMA synchronous=NORMAL`。

### P2-2: import 事务中冗余的分类校验

`importMaterialsFromJson` 的 `$transaction` 内部对每条语料都通过 `tx.category.findUnique` 检查分类是否存在（`src/features/importer/actions.ts:72-76`），但 `categoryId` 在页面层已经过校验。可以在事务开始前一次性确认分类存在，避免事务内重复查询。

### P2-3: 训练和复习缺少键盘快捷键

训练流程（提交答案 → 查看参考答案 → 自评 → 下一题）全部依赖鼠标点击，效率偏低。

**建议方案**:
- 训练：Enter 提交，1/2/3/4 自评（掌握/基本会/模糊/不会）
- 复习：1/2/3 对应认识/模糊/不认识

### P2-4: 挖空算法随机性不足

`createClozeQuestion` 使用 `Math.random()` 选取挖空位置，每次渲染结果不一致。在 SSR 场景下可能导致 hydration 不匹配（虽然当前是客户端组件，不算 bug，但后续切 SSR 会有问题）。

**建议方案**: 将随机种子绑定到 `materialId`，确保同一语料在同一会话中产生的题目稳定。

---

## P3 — 未来规划

### P3-1: 设置页功能填充

`/settings` 页面目前只返回一个占位标题，`AppSetting` 表已建好但未使用。未来可支持：
- 默认训练数量
- 默认训练模式
- 主题设置（夜间模式）

### P3-2: 训练历史统计

`TrainingRecord` 表已存储每次训练的全部信息，但没有任何数据展示页面。未来可增加：
- 训练记录日历热力图
- 各模式正确率统计
- 薄弱点分析（收集常错的 material）

### P3-3: 收藏的手动复习阶段调整

当前复习算法是固定的 SM-0 简化版，用户无法手动调整某个收藏的复习阶段或掌握程度。`mastery` 字段已预留。

### P3-4: 语料归档的恢复功能

`Material` 有 `isArchived` 字段用于软删除，但当前没有恢复已归档语料的 UI。也没有"回收站"页面。

### P3-5: 搜索结果

现在只能按分类浏览语料，没有全局搜索。随着语料数量增长，搜索（按标题、中文、英文、标签）会成为核心需求。

### P3-6: 批量操作

当前语料只能逐条编辑/删除/移动。未来可能需要：
- 批量移动（选中多条语料移到其他分类）
- 批量删除
- 批量打标签
