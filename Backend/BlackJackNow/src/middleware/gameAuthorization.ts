import { RoomWithUsersAndSeats } from '@shared-types/db/UserRoom';
import { ActionEvent } from '@shared-types/Game/Action';
import { GameState } from '@shared-types/Game/GameState';

/**
 * Checks if the user is authorized to take the given action in the game.
 *
 * A user is authorized if they are in the seat that the action is being taken
 * for, if they are the one who made a bet, or if they are the host and the action
 * is a 'Reset'.
 *
 * @param id - The ID of the user taking the action.
 * @param action - The action being taken.
 * @param gameState - The current state of the game.
 * @param roomData - The room data.
 * @returns true if the user is authorized, false otherwise.
 */
export const isAuthorizedGameAction = (
  id: number,
  action: ActionEvent,
  gameState: GameState,
  roomData: RoomWithUsersAndSeats
): boolean => {
  // Get all seats for the user
  const seatIndexes = gameState.players.find(
    (player) => player.userId === id
  )?.seatIndexes;
  // If there are no seats for the user, return false
  if (!seatIndexes || seatIndexes.length < 1) return false;
  // If the action is a bet, check if the user is the one who made the bet
  if (
    action.bet &&
    // gameState.seats[action.bet?.bettingSeat].player?.user_ID === id
    seatIndexes.includes(action.bet?.bettingSeat)
  ) {
    return true;
    // If the action is not a bet, check if it is the user's turn and the user is in the seat with the current hand
  }
  if (action.actionType === 'Reset') {
    const host = roomData.UserRooms.find((userRoom) => userRoom.host === true);
    if (host?.userId === id) return true;
  }
  // if (!(gameState.seats[action.seatIndex].player?.user_ID === id)) return false;
  if (!seatIndexes.includes(action.seatIndex)) return false;
  if (gameState.turnIndex === action.seatIndex) {
    return true;
  }
  if (gameState.seats[action.seatIndex].handIndex === action.handIndex)
    return true;
  return false;
};
