-- Convert previous /10 ratings to /5, rounded to the nearest half star.
UPDATE "Experience" SET "rating" = ROUND("rating"::numeric) / 2 WHERE "rating" IS NOT NULL;
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_rating_five_stars"
  CHECK ("rating" IS NULL OR ("rating" >= 0 AND "rating" <= 5 AND "rating" * 2 = FLOOR("rating" * 2)));
