/*
  Warnings:

  - Made the column `courseCode` on table `Timesheet` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Timesheet" ALTER COLUMN "courseCode" SET NOT NULL;
