-- CreateTable
CREATE TABLE "DailyGenerationSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "generateTime" TEXT,
    "totalCount" INTEGER NOT NULL DEFAULT 2,
    "dialogueCount" INTEGER NOT NULL DEFAULT 1,
    "monologueCount" INTEGER NOT NULL DEFAULT 0,
    "interviewCount" INTEGER NOT NULL DEFAULT 1,
    "articleCount" INTEGER NOT NULL DEFAULT 0,
    "ieltsCount" INTEGER NOT NULL DEFAULT 0,
    "allowSuggestCategory" BOOLEAN NOT NULL DEFAULT true,
    "autoImport" BOOLEAN NOT NULL DEFAULT false,
    "maxPendingDrafts" INTEGER NOT NULL DEFAULT 10,
    "learningGoal" TEXT,
    "focusNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailyGenerationBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "planJson" TEXT,
    "error" TEXT,
    "pendingDraftCountBefore" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailyGeneratedMaterialDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentType" TEXT,
    "categoryPathJson" TEXT,
    "contentJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "materialId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyGeneratedMaterialDraft_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "DailyGenerationBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DailyGenerationBatch_createdAt_idx" ON "DailyGenerationBatch"("createdAt");

-- CreateIndex
CREATE INDEX "DailyGenerationBatch_status_idx" ON "DailyGenerationBatch"("status");

-- CreateIndex
CREATE INDEX "DailyGeneratedMaterialDraft_status_idx" ON "DailyGeneratedMaterialDraft"("status");

-- CreateIndex
CREATE INDEX "DailyGeneratedMaterialDraft_createdAt_idx" ON "DailyGeneratedMaterialDraft"("createdAt");
