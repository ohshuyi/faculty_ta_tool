-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Untitled Task',
ALTER COLUMN "status" DROP DEFAULT;
