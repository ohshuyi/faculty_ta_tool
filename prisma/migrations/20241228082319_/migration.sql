/*
  Warnings:

  - You are about to drop the column `courseName` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `groupCode` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `groupType` on the `Class` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[classType,classGroup]` on the table `Class` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Class_courseCode_groupCode_key";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "courseName",
DROP COLUMN "groupCode",
DROP COLUMN "groupType",
ADD COLUMN     "classGroup" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "classType" TEXT NOT NULL DEFAULT 'Unknown';

-- CreateIndex
CREATE UNIQUE INDEX "Class_classType_classGroup_key" ON "Class"("classType", "classGroup");
