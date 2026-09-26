CREATE TABLE "GameCategory" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  CONSTRAINT "GameCategory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GameCategory_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "GameCategory_ownerId_position_idx" ON "GameCategory"("ownerId", "position");
ALTER TABLE "Game" ADD COLUMN "categoryId" TEXT;
CREATE INDEX "Game_categoryId_idx" ON "Game"("categoryId");
ALTER TABLE "Game" ADD CONSTRAINT "Game_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GameCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "GameCategory" ("id", "ownerId", "name", "position")
SELECT p."id" || '-category-' || c.position, p."id", c.name, c.position
FROM "Profile" p CROSS JOIN (VALUES
  (0, 'Plateforme'), (1, 'Action / aventure'), (2, 'RPG'), (3, 'Combat'),
  (4, 'Courses'), (5, 'Sport'), (6, 'Shoot ’em up'), (7, 'Stratégie / gestion'),
  (8, 'Réflexion / puzzle'), (9, 'Simulation'), (10, 'Autres')
) AS c(position, name);
