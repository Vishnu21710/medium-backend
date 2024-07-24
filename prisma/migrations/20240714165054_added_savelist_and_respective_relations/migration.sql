-- CreateTable
CREATE TABLE "SaveList" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "SaveList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PostToSaveList" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PostToSaveList_AB_unique" ON "_PostToSaveList"("A", "B");

-- CreateIndex
CREATE INDEX "_PostToSaveList_B_index" ON "_PostToSaveList"("B");

-- AddForeignKey
ALTER TABLE "SaveList" ADD CONSTRAINT "SaveList_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToSaveList" ADD CONSTRAINT "_PostToSaveList_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToSaveList" ADD CONSTRAINT "_PostToSaveList_B_fkey" FOREIGN KEY ("B") REFERENCES "SaveList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
