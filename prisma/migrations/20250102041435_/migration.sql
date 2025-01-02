/*
  Warnings:

  - You are about to drop the column `classId` on the `Ticket` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_classId_fkey";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "classId";

-- CreateTable
CREATE TABLE "_TicketClasses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TicketClasses_AB_unique" ON "_TicketClasses"("A", "B");

-- CreateIndex
CREATE INDEX "_TicketClasses_B_index" ON "_TicketClasses"("B");

-- AddForeignKey
ALTER TABLE "_TicketClasses" ADD CONSTRAINT "_TicketClasses_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TicketClasses" ADD CONSTRAINT "_TicketClasses_B_fkey" FOREIGN KEY ("B") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
