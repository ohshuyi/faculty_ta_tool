/*
  Warnings:

  - You are about to drop the column `ticketNumber` on the `Ticket` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Ticket_ticketNumber_key";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "ticketNumber";
