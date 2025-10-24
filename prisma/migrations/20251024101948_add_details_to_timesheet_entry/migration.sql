/*
  Warnings:

  - Added the required column `classDetails` to the `TimesheetEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseCode` to the `TimesheetEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TimesheetEntry" ADD COLUMN     "classDetails" TEXT NOT NULL,
ADD COLUMN     "courseCode" TEXT NOT NULL;
