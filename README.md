english-scene-trainer/
├── 📋 配置文件
├── .env                         # 环境变量配置
├── .gitignore                   # Git 忽略配置
├── eslint.config.mjs            # ESLint 配置
├── next.config.ts               # Next.js 项目配置
├── next-env.d.ts                # Next.js TypeScript 定义
├── postcss.config.mjs           # PostCSS 配置
├── prisma.config.ts             # Prisma 配置
├── tsconfig.json                # TypeScript 配置
├── components.json              # shadcn/ui 组件配置
├── package.json                 # 项目依赖和脚本
├──
├── 📚 文档
├── README.md                    # 项目说明
├──
├── 💾 数据库
├── prisma/
│   ├── schema.prisma            # Prisma 数据库模式定义
│   └── migrations/              # 数据库迁移文件
│       ├── migration_lock.toml
│       └── 20260508120404_init/
│           └── migration.sql
├──
├── 🎨 静态资源
├── public/                      # 公开静态文件
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├──
└── 📦 源代码（src/）
    ├── app/                     # Next.js 页面（App Router）
    │   ├── globals.css          # 全局样式
    │   ├── layout.tsx           # 根布局
    │   ├── page.tsx             # 首页
    │   ├── import/
    │   │   └── page.tsx         # 导入页面
    │   ├── library/
    │   │   └── page.tsx         # 学习库页面
    │   ├── review/
    │   │   └── page.tsx         # 复习页面
    │   ├── settings/
    │   │   └── page.tsx         # 设置页面
    │   └── train/
    │       └── page.tsx         # 训练页面
    │
    ├── components/              # React 组件
    │   ├── layout/              # 布局组件
    │   │   └── app-nav.tsx      # 应用导航
    │   ├── common/              # 通用组件（待开发）
    │   └── ui/                  # UI 组件库
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── dropdown-menu.tsx
    │       ├── input.tsx
    │       ├── scroll-area.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── sheet.tsx
    │       ├── sonner.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       └── textarea.tsx
    │
    ├── features/                # 业务功能模块（按功能划分）
    │   ├── ai/                  # AI 相关功能
    │   ├── categories/          # 分类管理
    │   ├── favorites/           # 收藏夹
    │   ├── importer/            # 导入功能
    │   ├── materials/           # 学习材料
    │   ├── review/              # 复习逻辑
    │   └── training/            # 训练逻辑
    │
    ├── lib/                     # 工具库
    │   ├── db.ts                # 数据库连接配置
    │   └── utils.ts             # 通用工具函数
    │
    └── types/                   # TypeScript 类型定义（待完善）