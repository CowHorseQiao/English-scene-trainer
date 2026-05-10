-- CreateTable
CREATE TABLE "MaterialSegment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "zh" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "speaker" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialSegment_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "zh" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'sentence',
    "scene" TEXT,
    "level" TEXT,
    "note" TEXT,
    "usage" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Material_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Material" ("categoryId", "createdAt", "difficulty", "en", "id", "isArchived", "level", "note", "scene", "title", "updatedAt", "usage", "zh") SELECT "categoryId", "createdAt", "difficulty", "en", "id", "isArchived", "level", "note", "scene", "title", "updatedAt", "usage", "zh" FROM "Material";
DROP TABLE "Material";
ALTER TABLE "new_Material" RENAME TO "Material";
CREATE INDEX "Material_categoryId_idx" ON "Material"("categoryId");
CREATE INDEX "Material_createdAt_idx" ON "Material"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "MaterialSegment_materialId_idx" ON "MaterialSegment"("materialId");
