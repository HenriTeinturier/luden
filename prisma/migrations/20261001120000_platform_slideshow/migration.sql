ALTER TABLE "Platform"
ADD COLUMN "slideshowEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "slideshowSeconds" INTEGER NOT NULL DEFAULT 8,
ADD CONSTRAINT "Platform_slideshowSeconds_check" CHECK ("slideshowSeconds" BETWEEN 3 AND 120);
