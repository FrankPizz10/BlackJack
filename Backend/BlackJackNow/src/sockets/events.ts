import { Server, Socket } from 'socket.io';
import { AppContext } from '../context';
import { Queue } from 'bullmq';
import { DbUser } from '@shared-types/db/User';
import {
  handleCreateRoom,
  handleJoinRoom,
  handleTakeSeat,
} from './handlers/roomHandlers';
import { handleTakeAction, startGame } from './handlers/gameHandlers';
import {
  JoinRoom,
  joinRoomSchema,
  TakeSeat,
  takeSeatSchema,
} from '@shared-types/db/Room';
import {
  ActionEvent,
  eventSchema,
  Event,
  actionEventSchema,
} from '@shared-types/Game/Action';
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
    // TODO check if user is in room from redis
    // if (!(socket as CustomSocket).roomUrl.has(startGameEvent.roomUrl)) {
    //   console.error('User not in room:', startGameEvent.roomUrl);
    //   socket.emit('error', 'User not in room');
    //   return;
    // }
    const roomWithUsersAndSeats = await getRoomInfoByUrl(
      context,
      startGameEvent.roomUrl
    )!;
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
    startGame(io, context, turnQueue, roomWithUsersAndSeats);
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
    const result = actionEventSchema.safeParse(actionData);
    if (!result.success) {
      io.to(actionData.roomUrl).emit('error', result.error.message);
      return;
    }
    // TODO authorize action with redis
    // if (!(socket as CustomSocket).roomUrl.has(actionData.roomUrl)) {
    //   console.error('User not in room:', actionData.roomUrl);
    //   socket.emit('error', 'User not in room');
    // }
    handleTakeAction(io, socket, context, turnQueue, actionData);
  });
  socket.on('takeSeat', (takeSeatData: TakeSeat) => {
    // if (!takeSeatData.roomUrl) return;
    // if (!(socket as CustomSocket).roomUrl.has(takeSeatData.roomUrl)) {
    //   console.error('User not in room:', takeSeatData.roomUrl);
    //   socket.emit('error', 'User not in room');
    // }
    const result = takeSeatSchema.safeParse(takeSeatData);
    if (!result.success) {
      io.to(takeSeatData.roomUrl).emit('error', result.error.message);
      return;
    }
    handleTakeSeat(io, socket, context, user, takeSeatData);
  });
};
