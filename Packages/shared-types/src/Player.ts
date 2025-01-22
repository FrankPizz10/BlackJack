import { Hand } from './Hand';
import { BlackJackAction } from './Action';

type PlayerStatus = 'AFK' | 'Won' | 'Pending' | 'Busted';

export type Player = {
  hands: Hand[];
  status: PlayerStatus;
  user_ID: number;
  take_action: (action: BlackJackAction) => BlackJackAction;
  get_user_ID: () => number;
  get_status: () => PlayerStatus;
  set_status: (newStatus: PlayerStatus) => void;
  get_hands: () => Hand[];
  set_hands: (newHands: Hand[]) => void;
};

/**
 * Creates a new player object with the given parameters.
 * @param user_ID Unique identifier of the player.
 * @param status Status of the player, defaults to 'Pending'.
 * @param hands Array of hands the player has, defaults to an empty array.
 */
export const createPlayer = (
  user_ID: number,
  status: PlayerStatus = 'Pending',
  hands: Hand[] = []
): Player => {
  /**
   * Takes an action and returns the same action.
   * @param action The action to take.
   */
  const take_action = (action: BlackJackAction): BlackJackAction => {
    return action;
  };

  /**
   * Returns the user ID.
   */
  const get_user_ID = (): number => {
    return user_ID;
  };

  /**
   * Returns the current status of the player.
   */
  const get_status = (): PlayerStatus => {
    return status;
  };

  /**
   * Sets the status of the player.
   * @param newStatus The new status.
   */
  const set_status = (newStatus: PlayerStatus): void => {
    status = newStatus;
  };

  /**
   * Returns the current hands of the player.
   */
  const get_hands = (): Hand[] => {
    return hands;
  };

  /**
   * Sets the hands of the player.
   * @param newHands The new hands.
   */
  const set_hands = (newHands: Hand[]): void => {
    hands = newHands;
  };

  return {
    hands,
    status,
    user_ID,
    take_action,
    get_user_ID,
    get_status,
    set_status,
    get_hands,
    set_hands,
  };
};
