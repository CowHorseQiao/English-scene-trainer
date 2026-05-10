-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MaterialSegment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "segmentType" TEXT NOT NULL DEFAULT 'paragraph',
    "zh" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "speaker" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialSegment_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MaterialSegment" ("createdAt", "en", "id", "materialId", "note", "order", "speaker", "zh") SELECT "createdAt", "en", "id", "materialId", "note", "order", "speaker", "zh" FROM "MaterialSegment";
DROP TABLE "MaterialSegment";
ALTER TABLE "new_MaterialSegment" RENAME TO "MaterialSegment";
CREATE INDEX "MaterialSegment_materialId_idx" ON "MaterialSegment"("materialId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
