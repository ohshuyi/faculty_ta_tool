-- CreateTable
CREATE TABLE "_TAClasses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TAClasses_AB_unique" ON "_TAClasses"("A", "B");

-- CreateIndex
CREATE INDEX "_TAClasses_B_index" ON "_TAClasses"("B");

-- AddForeignKey
ALTER TABLE "_TAClasses" ADD CONSTRAINT "_TAClasses_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TAClasses" ADD CONSTRAINT "_TAClasses_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
