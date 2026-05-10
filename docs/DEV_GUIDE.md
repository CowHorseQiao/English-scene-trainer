# 开发指南

---

## 本地启动

```bash
# 1. 安装依赖
npm install

# 2. 确保数据库已初始化（首次需执行）
npx prisma generate
npx prisma db push

# 3. 启动开发服务器
npm run dev
```

访问 `http://localhost:3000`。

---

## 数据库

### Prisma 命令

```bash
# 生成 Prisma Client（修改 schema 后必须执行）
npx prisma generate

# 将 schema 同步到数据库（开发阶段用，会丢失数据）
npx prisma db push

# 创建迁移（推荐用于生产）
npx prisma migrate dev --name <描述此次变更>

# 查看数据库内容（GUI 工具）
npx prisma studio

# 验证 schema 语法
npx prisma validate
```

### SQLite 数据库位置

数据库文件在 `prisma/dev.db`（由 `DATABASE_URL` 环境变量控制，默认 `file:./dev.db`）。

### 重新初始化数据库

```bash
# 注意：这会清空所有数据
rm prisma/dev.db
npx prisma db push
```

---

## 代码质量

### 常用命令

```bash
# 类型检查
npm run build

# Lint
npm run lint

# 数据库 schema 验证
npx prisma validate
```

**建议**: 每次提 PR 前跑一遍 `npm run build`，这会在编译层面捕获大多数类型错误。

### 项目约定

| 项目 | 惯例 |
|---|---|
| 路径别名 | `@/` 指向 `src/`（在 `tsconfig.json` 中配置） |
| Server Actions | 放在 `actions.ts`，使用 `"use server"` 指令 |
| 数据读取 | 放在 `queries.ts`，服务端组件直接调用 |
| 类型定义 | 放在 `types.ts` |
| 纯函数 | 放在 `utils.ts` |
| 客户端组件 | 文件顶部声明 `"use client"` |
| 数据库查询 | 仅通过 `src/lib/db.ts` 导出的 `db` 实例 |
| UI 组件 | 优先使用 `src/components/ui/` 中的 shadcn 组件 |

---

## Debug 常见问题

### Prisma Client 报错 "找不到模块 @prisma/client"

```bash
# schema 变更后 Client 没有重新生成
npx prisma generate
```

### 数据库报 "no such table"

```bash
# schema 尚未同步到数据库
npx prisma db push
```

### 开发服务器不热更新

- 检查文件是否在 `src/` 目录下
- `next.config.ts` 中 `appDir` 应已启用
- 尝试 `npm run dev` 重启

### "use server" 函数在浏览器端执行时报错

- 确认文件顶部有 `"use server"` 指令
- Server Actions 只能接受服务端可序列化的参数（不要传 React 组件或 DOM 元素）
- 检查 `next.config.ts` 确保 Server Actions 已启用（Next.js 16 默认启用）

### TypeScript 类型不匹配

- `MaterialDetail` 和 `MaterialListItem` 的区别：Detail 包含 `category` 和 `variants` 字段
- `CategoryFlatNode` 和 `CategoryTreeNode` 的区别：TreeNode 多了递归的 `children` 数组
- `FavoriteInfo` 的 `material` 字段可能为 `null`（独立收藏没有来源语料）

### ESLint 报错

```bash
# 检查是否有未使用的 import 或变量
npm run lint
```

### 导航到详情页时 404

- 确认语料 ID 存在于数据库（用 `prisma studio` 查看）
- 确认路由路径正确：`/library/material/[id]`

---

## 安全使用 AI 修改代码

### 基本原则

1. **不改 schema **: Prisma schema 是团队对数据模型的共同约定，改之前先讨论
2. **不改已有测试**: 如果已有测试，新增功能不应破坏现有测试
3. **逐一确认**: 每次修改后跑 `npm run build` 确认类型无误

### 修改前的检查清单

- [ ] 理解要修改的代码片段的功能（阅读文件头部的函数注释）
- [ ] 确认修改不会破坏 Prisma schema 的约束（唯一索引、外键等）
- [ ] 确认修改符合项目的类型定义（特别是 `types.ts` 中定义的类型）
- [ ] 确认 Server Action 的 `revalidatePath` 参数正确

### 修改后的检查清单

- [ ] `npm run build` 通过
- [ ] `npx prisma validate` 通过（如果改了 schema）
- [ ] 在浏览器中手动测试涉及的功能
- [ ] 检查浏览器控制台有无报错

### LLM 陷阱

- **幻读文件**: AI 可能引用 `src/features/ai/` 等不存在的文件。先 `ls` 确认文件存在。
- **幻觉 API**: AI 可能推荐不存在的 npm 包或 Prisma API。以现有代码为准。
- **过度抽象**: 优先复制三行相似代码而不是引入一个新抽象。AI 倾向于过度设计。
- **忽视 SQLite 限制**: SQLite 不支持 `ALTER COLUMN`、不支持 `enum` 类型、不支持 `CREATE INDEX CONCURRENTLY`。
- **导入路径错误**: 确认 import 路径以 `@/` 开头（除非是同一目录的相对路径）。
