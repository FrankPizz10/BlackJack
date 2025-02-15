import { Server, Socket } from 'socket.io';
import { DbUser } from '@shared-types/db/User';
import { CustomSocket } from '../index';
import { AppContext } from '../../context';
import { createRoom } from '../../services/roomsService';
import { createUserRoom } from '../../services/userRoomService';
import {
  CreateUserRoom,
  createUserRoomSchema,
} from '@shared-types/db/UserRoom';
import { StartGame } from '@shared-types/db/Game';
import { JoinRoom } from '@shared-types/db/Room';
import { createUserSeat } from '../../services/userSeatService';

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
    };
    const result = createUserRoomSchema.safeParse(userRoomData);
    if (!result.success) {
      console.error('Invalid user room data:', userRoomData);
      return;
    }
    const userRoom = await createUserRoom(context, userRoomData);
    console.log('User room created:', userRoom);
    const userSeat = await createUserSeat(context, userRoom);
    console.log('User seat created:', userSeat);
    // join room
    console.log('Joining room:', roomDb.url);
    socket.join(roomDb.url);
    const startGame: StartGame = {
      roomDb,
      userRoomDb: userRoom,
      userSeatDb: userSeat,
    };
    io.to(socket.id).emit('roomCreated', startGame);
    // Store the room url inside socket.data
    (socket as CustomSocket).roomUrl.add(roomDb.url);
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
  };
  const userRoom = await createUserRoom(context, userRoomData);
  // join room
  socket.join(joinRoomData.roomUrl);
  // Store the room ID inside socket.data
  (socket as CustomSocket).roomUrl.add(joinRoomData.roomUrl);
  // update redis game state
  try {
    // broadcast player joined room
    io.to(joinRoomData.roomUrl).emit('roomJoined', userRoom);
  } catch (err) {
    console.error('Error updating game state:', err);
  }
};
