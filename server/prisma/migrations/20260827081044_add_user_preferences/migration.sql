-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allergies" TEXT[],
ADD COLUMN     "defaultServings" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "diet" TEXT,
ADD COLUMN     "favoriteCuisine" TEXT;
