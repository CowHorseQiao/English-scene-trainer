-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'cloze',
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PracticeSession_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "exerciseIndex" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "userAnswer" TEXT,
    "referenceAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "selfRating" TEXT,
    "aiScore" INTEGER,
    "aiFeedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeExerciseCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "exercises" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PracticeSession_materialId_idx" ON "PracticeSession"("materialId");

-- CreateIndex
CREATE INDEX "PracticeSession_status_idx" ON "PracticeSession"("status");

-- CreateIndex
CREATE INDEX "PracticeAnswer_sessionId_idx" ON "PracticeAnswer"("sessionId");

-- CreateIndex
CREATE INDEX "PracticeExerciseCache_materialId_idx" ON "PracticeExerciseCache"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeExerciseCache_materialId_mode_key" ON "PracticeExerciseCache"("materialId", "mode");
