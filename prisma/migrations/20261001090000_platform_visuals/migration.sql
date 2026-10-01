CREATE TYPE "PlatformVisualKind" AS ENUM ('BANNER', 'POSTER');
CREATE TABLE "PlatformVisual" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "platformId" TEXT NOT NULL,
  "kind" "PlatformVisualKind" NOT NULL,
  "path" TEXT NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "caption" TEXT NOT NULL DEFAULT '',
  "active" BOOLEAN NOT NULL DEFAULT false,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformVisual_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformVisual_default_active" CHECK (NOT "isDefault" OR "active"),
  CONSTRAINT "PlatformVisual_position_nonnegative" CHECK ("position" >= 0),
  CONSTRAINT "PlatformVisual_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PlatformVisual_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PlatformVisual_path_key" ON "PlatformVisual"("path");
CREATE INDEX "PlatformVisual_ownerId_platformId_kind_position_idx" ON "PlatformVisual"("ownerId", "platformId", "kind", "position");
CREATE UNIQUE INDEX "PlatformVisual_one_default" ON "PlatformVisual"("ownerId", "platformId", "kind") WHERE "isDefault";
