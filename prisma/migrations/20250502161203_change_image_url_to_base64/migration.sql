/*
  Warnings:

  - You are about to alter the column `name` on the `Color` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `hex` on the `Color` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(7)`.
  - You are about to drop the column `url` on the `Image` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `Motorcycle` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `base64` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Color" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "hex" SET DATA TYPE VARCHAR(7);

-- AlterTable
ALTER TABLE "Image" ADD COLUMN "base64" TEXT;

-- Update existing URLs to base64
UPDATE "Image" SET "base64" = "url";

-- Remove the url column
ALTER TABLE "Image" DROP COLUMN "url";

-- Make base64 non-nullable
ALTER TABLE "Image" ALTER COLUMN "base64" SET NOT NULL;

-- AlterTable
ALTER TABLE "Motorcycle" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- DropTable
DROP TABLE "User";

-- CreateIndex
CREATE INDEX "Color_motorcycleId_idx" ON "Color"("motorcycleId");

-- CreateIndex
CREATE INDEX "Image_motorcycleId_idx" ON "Image"("motorcycleId");

-- CreateIndex
CREATE INDEX "Motorcycle_name_idx" ON "Motorcycle"("name");

-- CreateIndex
CREATE INDEX "Motorcycle_isSold_idx" ON "Motorcycle"("isSold");
