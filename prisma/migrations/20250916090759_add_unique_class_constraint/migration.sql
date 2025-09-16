/*
  Warnings:

  - A unique constraint covering the columns `[courseCode,classGroup,classType]` on the table `Class` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Class_courseCode_classGroup_key";

-- CreateIndex
CREATE UNIQUE INDEX "Class_courseCode_classGroup_classType_key" ON "Class"("courseCode", "classGroup", "classType");
