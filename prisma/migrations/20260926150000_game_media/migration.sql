CREATE TYPE "MediaSource" AS ENUM ('UPLOAD', 'EXTERNAL_URL', 'IGDB');
CREATE TYPE "MediaCategory" AS ENUM ('COVER', 'SCREENSHOT', 'BOX', 'MEDIA', 'DOCUMENT', 'OTHER');
CREATE TYPE "LinkType" AS ENUM ('VIDEO', 'REVIEW', 'ARTICLE', 'GUIDE', 'OTHER');
ALTER TABLE "Media" ADD COLUMN "source" "MediaSource" NOT NULL DEFAULT 'UPLOAD';
UPDATE "Media" SET "source" = CASE WHEN "sourceUrl" LIKE 'https://images.igdb.com/%'
  THEN 'IGDB'::"MediaSource" ELSE 'EXTERNAL_URL'::"MediaSource" END WHERE "sourceUrl" IS NOT NULL;

CREATE TABLE "MediaAttachment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "mediaId" TEXT NOT NULL REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "gameId" TEXT REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "possessionId" TEXT REFERENCES "Possession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "category" "MediaCategory" NOT NULL DEFAULT 'COVER',
  "position" INTEGER NOT NULL DEFAULT 0 CHECK ("position" >= 0),
  "caption" TEXT NOT NULL DEFAULT '',
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "MediaAttachment_context_check" CHECK (("gameId" IS NOT NULL) <> ("possessionId" IS NOT NULL))
);
CREATE UNIQUE INDEX "MediaAttachment_gameId_mediaId_key" ON "MediaAttachment"("gameId", "mediaId");
CREATE UNIQUE INDEX "MediaAttachment_possessionId_mediaId_key" ON "MediaAttachment"("possessionId", "mediaId");
CREATE INDEX "MediaAttachment_gameId_position_idx" ON "MediaAttachment"("gameId", "position");
CREATE INDEX "MediaAttachment_possessionId_position_idx" ON "MediaAttachment"("possessionId", "position");
CREATE UNIQUE INDEX "MediaAttachment_game_primary" ON "MediaAttachment"("gameId") WHERE "isPrimary" AND "gameId" IS NOT NULL;
CREATE UNIQUE INDEX "MediaAttachment_possession_primary" ON "MediaAttachment"("possessionId") WHERE "isPrimary" AND "possessionId" IS NOT NULL;

INSERT INTO "MediaAttachment" ("id", "mediaId", "gameId", "category", "isPrimary")
SELECT 'legacy_' || "id", "coverId", "id", 'COVER', true FROM "Game" WHERE "coverId" IS NOT NULL;

CREATE TABLE "GameLink" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "gameId" TEXT NOT NULL REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "url" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT '',
  "type" "LinkType" NOT NULL DEFAULT 'OTHER',
  "position" INTEGER NOT NULL DEFAULT 0 CHECK ("position" >= 0)
);
CREATE INDEX "GameLink_gameId_position_idx" ON "GameLink"("gameId", "position");
