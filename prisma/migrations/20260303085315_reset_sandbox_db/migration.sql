/*
  Warnings:

  - The values [LAB_TECH] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `labId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Lab` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LabIssue` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('USER', 'TA', 'PROFESSOR', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropForeignKey
ALTER TABLE "LabIssue" DROP CONSTRAINT "LabIssue_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "LabIssue" DROP CONSTRAINT "LabIssue_labId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_labId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "labId";

-- DropTable
DROP TABLE "Lab";

-- DropTable
DROP TABLE "LabIssue";
