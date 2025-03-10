import { ActionEvent } from '@shared-types/Game/Action';
import { GameState } from '@shared-types/Game/GameState';

export const isAuthorizedGameAction = (
  id: number,
  action: ActionEvent,
  gameState: GameState
): boolean => {
  // Get all seats for the user
  const seats = gameState.seats.filter((seat) => seat.player?.user_ID === id);
  // If there are no seats for the user, return false
  if (seats.length === 0) return false;
  // If the action is a bet, check if the user is the one who made the bet
  if (
    action.bet &&
    gameState.seats[action.bet?.bettingSeat].player?.user_ID === id
  ) {
    return true;
    // If the action is not a bet, check if it is the user's turn and the user is in the seat with the current hand
  }
  if (!(gameState.seats[action.seatIndex].player?.user_ID === id)) return false;
  if (gameState.turnIndex === action.seatIndex) {
    return true;
  }
  if (gameState.seats[action.seatIndex].handIndex === action.handIndex)
    return true;
  return false;
};

