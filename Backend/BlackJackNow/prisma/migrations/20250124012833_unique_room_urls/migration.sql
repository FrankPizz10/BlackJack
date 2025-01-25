/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Rooms` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Rooms_url_key" ON "Rooms"("url");
