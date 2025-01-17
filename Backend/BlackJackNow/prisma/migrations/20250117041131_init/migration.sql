-- CreateEnum
CREATE TYPE "Request_Status" AS ENUM ('pending', 'approved', 'filled');

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rooms" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "gameTableId" INTEGER NOT NULL,
    "roomOpenTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomCloseTime" TIMESTAMP(3),
    "maxRoomSize" INTEGER NOT NULL DEFAULT 15,

    CONSTRAINT "Rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game_Table" (
    "id" SERIAL NOT NULL,
    "maxSeats" INTEGER NOT NULL DEFAULT 7,
    "minBet" INTEGER NOT NULL,
    "maxBet" INTEGER NOT NULL,
    "timeToAct" INTEGER NOT NULL DEFAULT 20,
    "timeToBet" INTEGER NOT NULL DEFAULT 15,
    "maxAwayTime" INTEGER NOT NULL DEFAULT 3,
    "numberOfDecks" INTEGER NOT NULL DEFAULT 6,
    "shuffleFrequency" INTEGER NOT NULL DEFAULT 1,
    "blackJackPayout" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "insurancePayout" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "surrender" BOOLEAN NOT NULL DEFAULT false,
    "doubleAfterSplit" BOOLEAN NOT NULL DEFAULT true,
    "maxSplits" INTEGER NOT NULL DEFAULT 3,
    "resplitAces" BOOLEAN NOT NULL DEFAULT true,
    "soft17" BOOLEAN NOT NULL DEFAULT true,
    "sideBets" BOOLEAN NOT NULL DEFAULT false,
    "betOnOtherBoxes" BOOLEAN NOT NULL DEFAULT false,
    "rejoin" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Game_Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seats" (
    "id" SERIAL NOT NULL,
    "position" INTEGER NOT NULL,
    "userTableId" INTEGER NOT NULL,
    "handsPlayed" INTEGER,
    "handsWon" INTEGER,
    "blackjacks" INTEGER,

    CONSTRAINT "Seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_Room" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "initialStack" INTEGER,
    "finalStack" INTEGER,
    "awayTime" TIMESTAMP(3),
    "host" BOOLEAN NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game_Requests" (
    "id" SERIAL NOT NULL,
    "userRoomId" INTEGER NOT NULL,
    "requestedStack" INTEGER NOT NULL,
    "status" "Request_Status" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_Requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_uid_key" ON "Users"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Rooms_gameTableId_key" ON "Rooms"("gameTableId");

-- CreateIndex
CREATE UNIQUE INDEX "Seats_userTableId_key" ON "Seats"("userTableId");

-- CreateIndex
CREATE UNIQUE INDEX "User_Room_userId_roomId_key" ON "User_Room"("userId", "roomId");

-- AddForeignKey
ALTER TABLE "Rooms" ADD CONSTRAINT "Rooms_gameTableId_fkey" FOREIGN KEY ("gameTableId") REFERENCES "Game_Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seats" ADD CONSTRAINT "Seats_userTableId_fkey" FOREIGN KEY ("userTableId") REFERENCES "User_Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Room" ADD CONSTRAINT "User_Room_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Room" ADD CONSTRAINT "User_Room_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game_Requests" ADD CONSTRAINT "Game_Requests_userRoomId_fkey" FOREIGN KEY ("userRoomId") REFERENCES "User_Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
