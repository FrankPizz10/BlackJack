/*
  Warnings:

  - You are about to drop the column `userTableId` on the `Seats` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userRoomId]` on the table `Seats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userRoomId` to the `Seats` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Seats" DROP CONSTRAINT "Seats_userTableId_fkey";

-- DropIndex
DROP INDEX "Seats_userTableId_key";

-- AlterTable
ALTER TABLE "Seats" DROP COLUMN "userTableId",
ADD COLUMN     "userRoomId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Seats_userRoomId_key" ON "Seats"("userRoomId");

-- AddForeignKey
ALTER TABLE "Seats" ADD CONSTRAINT "Seats_userRoomId_fkey" FOREIGN KEY ("userRoomId") REFERENCES "User_Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
