/*
  Warnings:

  - You are about to drop the column `Location` on the `books` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "books" DROP COLUMN "Location",
ADD COLUMN     "location" VARCHAR(20);
