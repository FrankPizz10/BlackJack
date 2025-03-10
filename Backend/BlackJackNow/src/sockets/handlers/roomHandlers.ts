import { Server, Socket } from 'socket.io';
import { DbUser } from '@shared-types/db/User';
import { CustomSocket } from '../index';
import { AppContext } from '../../context';
import {
  createRoom,
  getRoomInfoByUrl,
  createSeat,
} from '../../services/roomsService';
import { createUserRoom } from '../../services/userRoomService';
import {
  CreateUserRoom,
  createUserRoomSchema,
  userRoomSchema,
} from '@shared-types/db/UserRoom';
import { StartGame } from '@shared-types/db/Game';
import { JoinRoom, TakeSeat } from '@shared-types/db/Room';
import { createUserSeat } from '../../services/userSeatService';
import { GameState, takeSeat } from '@shared-types/Game/GameState';
import { Player } from '@shared-types/Game/Player';

export const handleCreateRoom = async (
  io: Server,
  socket: Socket,
  context: AppContext,
  user: DbUser
) => {
  console.log('Creating new room:');
  // create room
  try {
    const { roomDb } = await createRoom(context);
    if (!roomDb) return;
    const userRoomData: CreateUserRoom = {
      userId: user.id,
      roomId: roomDb.id,
      host: true,
      name: socket.id,
      initialStack: 100,
    };
    const result = createUserRoomSchema.safeParse(userRoomData);
    if (!result.success) {
      console.error('Invalid user room data:', userRoomData);
      return;
    }
    const userRoom = await createUserRoom(context, userRoomData);
    console.log('User room created:', userRoom);
    const parsedUserRoom = userRoomSchema.parse(userRoom);
    const userSeat = await createUserSeat(context, parsedUserRoom);
    console.log('User seat created:', userSeat);
    // join room
    console.log('Joining room:', roomDb.url);
    socket.join(roomDb.url);
    const startGame: StartGame = {
      roomDb,
      userRoomDb: parsedUserRoom,
      userSeatDb: userSeat,
    };
    io.to(socket.id).emit('roomCreated', startGame);
    // TODO store room url in redis
    // // Store the room url inside socket.data
    // (socket as CustomSocket).roomUrl.add(roomDb.url);
  } catch (err) {
    console.error('Error creating room:', err);
  }
};

export const handleJoinRoom = async (
  io: Server,
  socket: Socket,
  context: AppContext,
  user: DbUser,
  joinRoomData: JoinRoom
) => {
  if (!joinRoomData.roomUrl) return;
  // Check if room is full
  const roomWithSize = await context.prisma.rooms.findUniqueOrThrow({
    where: { url: joinRoomData.roomUrl },
    include: {
      _count: {
        select: { UserRoom: true },
      },
    },
  });
  const roomsize = roomWithSize._count.UserRoom;
  if (roomsize >= 12) {
    console.log('Room is full');
    socket.emit('error', 'Room is full');
    return;
  }
  console.log('Joining room:', joinRoomData.roomUrl);
  // create user room
  const userRoomData: CreateUserRoom = {
    userId: user.id,
    roomId: roomWithSize.id,
    host: false,
    name: socket.id,
    initialStack: 100,
  };
  await createUserRoom(context, userRoomData);
  const roomWithUsersAndSeats = await getRoomInfoByUrl(
    context,
    joinRoomData.roomUrl
  );
  // join room
  socket.join(joinRoomData.roomUrl);
  // TODO store room url in redis
  // Store the room ID inside socket.data
  // (socket as CustomSocket).roomUrl.add(joinRoomData.roomUrl);
  // update redis game state
  try {
    // broadcast player joined room
    io.to(joinRoomData.roomUrl).emit('roomJoined', roomWithUsersAndSeats);
  } catch (err) {
    console.error('Error updating game state:', err);
  }
};

export const handleTakeSeat = async (
  io: Server,
  socket: Socket,
  context: AppContext,
  user: DbUser,
  takeSeatData: TakeSeat
) => {
  console.log('Taking seat:', socket.id);
  // Check if seat is available
  const roomInfo = await getRoomInfoByUrl(context, takeSeatData.roomUrl);
  if (!roomInfo) return;
  // Check if table is full
  if (roomInfo.UserRooms.length >= 7) {
    console.log('Table is full');
    socket.emit('error', 'Table is full');
    return;
  }
  // Check if seat is already taken
  if (
    roomInfo.UserRooms.some((ur) =>
      ur.UserSeats.some((us) => us.position === takeSeatData.seatPosition)
    )
  ) {
    console.log('Seat is already taken');
    socket.emit('error', 'Seat is already taken');
    return;
  }
  // take seat
  const seat = await createSeat(
    context,
    takeSeatData.roomUrl,
    takeSeatData.seatPosition,
    takeSeatData.userRoomId
  );
  if (!seat) {
    console.error('Error taking seat');
    socket.emit('error', 'Error taking seat');
    return;
  }
  // update redis game state
  try {
    const gameStateRaw = await context.redis.get(
      `gameState:${takeSeatData.roomUrl}`
    );
    if (!gameStateRaw) {
      io.to(takeSeatData.roomUrl).emit('seatTaken', seat);
      return;
    }
    const gameState: GameState = JSON.parse(gameStateRaw);
    if (!gameState) return console.error('Game state invalid');
    const player: Player = {
      user_ID: user.id,
      stack: 100,
      userRoomDbId: roomInfo.UserRooms.find((ur) => ur.userId === user.id)!.id,
      gameTableDbId: roomInfo.gameTableId,
    };
    const updatedGameState = takeSeat(gameState, player, seat.position);
    // broadcast player joined room
    io.to(takeSeatData.roomUrl).emit('seatTaken', seat);
    await context.redis.set(
      `gameState:${takeSeatData.roomUrl}`,
      JSON.stringify(updatedGameState)
    );
    io.to(takeSeatData.roomUrl).emit('gameState', updatedGameState);
  } catch (err) {
    console.error('Error updating game state:', err);
  }
};
