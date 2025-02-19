import { Server, Socket } from 'socket.io';
import { AppContext } from '../context';
import { Queue } from 'bullmq';
import { DbUser } from '@shared-types/db/User';
import { handleCreateRoom, handleJoinRoom } from './handlers/roomHandlers';
import { handleTakeAction, startGame } from './handlers/gameHandlers';
import { JoinRoom, joinRoomSchema } from '@shared-types/db/Room';
import { ActionEvent, eventSchema, Event } from '@shared-types/Action';
import { CustomSocket } from '.';
import { getRoomInfoByUrl } from '../services/roomsService';
import { RoomWithUsersAndSeats } from '@shared-types/db/UserRoom';

export const registerSocketEvents = (
  io: Server,
  socket: Socket,
  context: AppContext,
  turnQueue: Queue,
  user: DbUser
) => {
  socket.on('createRoom', () => {
    handleCreateRoom(io, socket, context, user);
  });
  socket.on('startGame', async (startGameEvent: Event) => {
    const result = eventSchema.safeParse(startGameEvent);
    if (!result.success) {
      console.error('Invalid game data:', startGameEvent);
      socket.emit('error', 'Invalid game data');
      return;
    }
    if (!(socket as CustomSocket).roomUrl.has(startGameEvent.roomUrl)) {
      console.error('User not in room:', startGameEvent.roomUrl);
      socket.emit('error', 'User not in room');
      return;
    }
    const roomInfo = await getRoomInfoByUrl(context, startGameEvent.roomUrl)!;
    const roomWithUsersAndSeats: RoomWithUsersAndSeats = {
      ...roomInfo.roomDb,
      UserRooms: roomInfo.roomDb.UserRoom.map((userRoom) => ({
        id: userRoom.id,
        userId: userRoom.userId,
        roomId: userRoom.roomId,
        host: userRoom.host,
        name: userRoom.name,
        initialStack: userRoom.initialStack || 100,
        UserSeat: userRoom.Seats!,
      })),
    };
    const currentUserRoomAndSeat = roomWithUsersAndSeats.UserRooms.find(
      (userRoom) => userRoom.userId === user.id
    );
    if (!currentUserRoomAndSeat) {
      console.error('User not in room:', startGameEvent.roomUrl);
      socket.emit('error', 'User not in room');
      return;
    }
    if (!currentUserRoomAndSeat.host) {
      console.error('User is not the host:', startGameEvent.roomUrl);
      socket.emit('error', 'User is not the host');
      return;
    }
    startGame(
      io,
      context,
      turnQueue,
      roomWithUsersAndSeats,
      currentUserRoomAndSeat
    );
  });
  socket.on('joinRoom', (joinRoomData: JoinRoom) => {
    const result = joinRoomSchema.safeParse(joinRoomData);
    if (!result.success) {
      console.error('Invalid join room data:', joinRoomData);
      socket.emit('error', 'Invalid join room data');
    }
    handleJoinRoom(io, socket, context, user, joinRoomData);
  });
  socket.on('takeAction', (actionData: ActionEvent) => {
    if (!actionData.roomUrl) return;
    if (!(socket as CustomSocket).roomUrl.has(actionData.roomUrl)) {
      console.error('User not in room:', actionData.roomUrl);
      socket.emit('error', 'User not in room');
    }
    handleTakeAction(io, context, turnQueue, actionData);
  });
};
