/*
  Warnings:

  - Added the required column `weekNumber` to the `TimesheetEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TimesheetEntry" ADD COLUMN     "weekNumber" INTEGER NOT NULL;
