/*
  Warnings:

  - A unique constraint covering the columns `[courseCode,groupCode]` on the table `Class` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Class_courseCode_groupCode_key" ON "Class"("courseCode", "groupCode");
