-- CreateEnum
CREATE TYPE "CourseRole" AS ENUM ('COURSE_COORDINATOR', 'TUTOR', 'TA');

-- CreateTable
CREATE TABLE "UserCourseRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "courseCode" TEXT NOT NULL,
    "role" "CourseRole" NOT NULL,

    CONSTRAINT "UserCourseRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCourseRole_userId_courseCode_key" ON "UserCourseRole"("userId", "courseCode");

-- AddForeignKey
ALTER TABLE "UserCourseRole" ADD CONSTRAINT "UserCourseRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
