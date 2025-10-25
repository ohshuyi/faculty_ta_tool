/*
  Warnings:

  - You are about to drop the column `courseCode` on the `TimesheetEntry` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,period,courseCode]` on the table `Timesheet` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Timesheet_userId_period_key";

-- AlterTable
ALTER TABLE "Timesheet" ADD COLUMN     "courseCode" TEXT;

-- AlterTable
ALTER TABLE "TimesheetEntry" DROP COLUMN "courseCode";

-- CreateTable
CREATE TABLE "_TimesheetApprovers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TimesheetApprovers_AB_unique" ON "_TimesheetApprovers"("A", "B");

-- CreateIndex
CREATE INDEX "_TimesheetApprovers_B_index" ON "_TimesheetApprovers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Timesheet_userId_period_courseCode_key" ON "Timesheet"("userId", "period", "courseCode");

-- AddForeignKey
ALTER TABLE "_TimesheetApprovers" ADD CONSTRAINT "_TimesheetApprovers_A_fkey" FOREIGN KEY ("A") REFERENCES "Timesheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TimesheetApprovers" ADD CONSTRAINT "_TimesheetApprovers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
