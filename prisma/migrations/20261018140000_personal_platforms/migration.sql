ALTER TABLE "Platform" ADD COLUMN "ownerId" TEXT,
  ADD COLUMN "catalogPlatformId" TEXT,
  ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Platform" ADD CONSTRAINT "Platform_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Platform" ADD CONSTRAINT "Platform_catalogPlatformId_fkey" FOREIGN KEY ("catalogPlatformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Platform" ADD CONSTRAINT "Platform_personal_metadata_check" CHECK (
  ("ownerId" IS NOT NULL OR ("catalogPlatformId" IS NULL AND NOT "isDraft"))
  AND ("catalogPlatformId" IS NULL OR "catalogPlatformId" <> "id")
);
CREATE INDEX "Platform_ownerId_isDraft_idx" ON "Platform"("ownerId", "isDraft");
