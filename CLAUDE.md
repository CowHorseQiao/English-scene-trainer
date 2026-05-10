# English Scene Trainer - Claude Code Instructions

## Project Overview

This is a personal English learning web app.

Tech stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- SQLite
- Zod

The project uses the `src/` structure. Do not create root-level `app/`, `components/`, or `lib/`.

## Core Modules

- `src/features/categories`: category tree
- `src/features/materials`: material management
- `src/features/importer`: JSON import
- `src/features/training`: cloze and zh-to-en training
- `src/features/favorites`: favorite expressions
- `src/features/review`: spaced review
- `src/app`: pages and routes
- `prisma/schema.prisma`: database schema

## Rules

1. Before editing, inspect the relevant files and explain the plan.
2. Only modify files related to the current task.
3. Do not change Prisma schema unless explicitly allowed.
4. Do not introduce new dependencies unless necessary.
5. Do not implement AI chat, speech, multi-user, or unrelated features.
6. Keep the app simple and maintainable.
7. After changes, run type check/build/lint when appropriate.
8. Always list changed files and testing steps.

## Current Development Style

Use issue-based development:
- one task at a time
- small patches
- local testing
- git commit after each stable improvement

## Commands

Use these commands for validation:
- `npm run dev`
- `npm run lint`
- `npm run build`
- `npx prisma validate`
- `npx prisma studio`