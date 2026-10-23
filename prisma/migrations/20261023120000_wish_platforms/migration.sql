CREATE TABLE "GameWishPlatform" (
    "gameId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    CONSTRAINT "GameWishPlatform_pkey" PRIMARY KEY ("gameId", "platformId")
);

CREATE INDEX "GameWishPlatform_platformId_idx" ON "GameWishPlatform"("platformId");
ALTER TABLE "GameWishPlatform" ADD CONSTRAINT "GameWishPlatform_gameId_fkey"
    FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameWishPlatform" ADD CONSTRAINT "GameWishPlatform_platformId_fkey"
    FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
