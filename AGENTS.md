# English Scene Trainer - Agent Instructions

## Project Overview

This is a personal English learning web app.

Tech stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- SQLite
- DeepSeek API
- Volcengine Doubao TTS
- MP3 audio cache

## Main Routes

- `/` - material feed
- `/add` - AI generation and JSON import
- `/library` - category tree and material management
- `/library/material/[id]` - material detail / reading
- `/read/[id]` - focused reading page
- `/train` - cloze and zh-to-en practice
- `/review` - FSRS review system
- `/settings` - settings
- `/debug/mobile` - mobile hydration/debug page

## Important Rules

1. Do not modify Prisma schema unless explicitly asked.
2. Do not change API routes unless explicitly asked.
3. Do not change AI generation logic unless explicitly asked.
4. Do not change TTS provider or audio cache logic unless explicitly asked.
5. Do not change FSRS scheduling unless explicitly asked.
6. Do not change training scoring logic unless explicitly asked.
7. Preserve desktop behavior while improving mobile UI.
8. iPhone verification must use production mode:
   - `npm run mobile:test`
   Do not judge iPhone behavior from `npm run dev`.
9. Run `npm run build` after changes.
10. Prefer small, reviewable changes.
11. Before editing, explain the plan and list files to modify.

## Useful Commands

- Install dependencies: `npm install`
- Build: `npm run build`
- Local desktop dev: `npm run dev:local`
- Mobile production test: `npm run mobile:test`
- Prisma validate: `npx prisma validate`
- Prisma generate: `npx prisma generate`

## Do Not Touch Unless Asked

- `prisma/schema.prisma`
- TTS provider internals
- FSRS algorithm
- DeepSeek prompt generation
- database migration files
- deployment configuration