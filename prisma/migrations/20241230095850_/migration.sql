/*
  Warnings:

  - You are about to drop the column `classId` on the `Task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_classId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "classId";

-- CreateTable
CREATE TABLE "_TaskClasses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TaskClasses_AB_unique" ON "_TaskClasses"("A", "B");

-- CreateIndex
CREATE INDEX "_TaskClasses_B_index" ON "_TaskClasses"("B");

-- AddForeignKey
ALTER TABLE "_TaskClasses" ADD CONSTRAINT "_TaskClasses_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskClasses" ADD CONSTRAINT "_TaskClasses_B_fkey" FOREIGN KEY ("B") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
