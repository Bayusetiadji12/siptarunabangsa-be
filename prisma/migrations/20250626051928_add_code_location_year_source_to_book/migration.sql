-- CreateEnum
CREATE TYPE "BookSource" AS ENUM ('PEMBELIAN', 'SUMBANGAN');

-- AlterTable
ALTER TABLE "books" ADD COLUMN     "Location" VARCHAR(20),
ADD COLUMN     "code" VARCHAR(50),
ADD COLUMN     "source" "BookSource" NOT NULL DEFAULT 'PEMBELIAN',
ADD COLUMN     "year" INTEGER;
