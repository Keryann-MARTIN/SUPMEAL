-- CreateTable
CREATE TABLE "Recipe" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "ingredients" TEXT[],
    "steps" TEXT[],
    "prepTime" INTEGER NOT NULL,
    "cookTime" INTEGER NOT NULL,
    "servings" INTEGER NOT NULL,
    "tags" TEXT[],
    "imageUrl" TEXT,
    "source" TEXT,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "plannedAt" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,
    "cookbookId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_cookbookId_fkey" FOREIGN KEY ("cookbookId") REFERENCES "Cookbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
