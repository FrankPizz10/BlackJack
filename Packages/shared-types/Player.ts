import { CardPair } from './CardPair';
import { BlackJackAction } from './Action';
import { PlayerStatus } from './PlayerStatus';

export interface Player {
  hand: (CardPair[] | null)[];
  status: PlayerStatus;
  user_ID: number;
  take_action: (action: BlackJackAction) => BlackJackAction;
  get_user_ID: () => number;
  get_hand_count: () => [number, number];
  get_status: () => PlayerStatus;
  set_status: (newStatus: PlayerStatus) => void;
  get_hand: () => (CardPair[] | null)[];
  set_hand: (newHand: (CardPair[] | null)[]) => void;
}

/**
 * A player in the game of Blackjack.
 */
export interface Player {
  /**
   * The current hand of the player.
   */
  hand: (CardPair[] | null)[];
  /**
   * The current status of the player.
   */
  status: PlayerStatus;
  /**
   * The ID of the user.
   */
  user_ID: number;
  /**
   * The function to take an action.
   * @param action - The action to take.
   * @returns The action taken.
   */
  take_action: (action: BlackJackAction) => BlackJackAction;
  /**
   * Gets the ID of the user.
   * @returns The ID of the user.
   */
  get_user_ID: () => number;
  /**
   * Gets the count of the hand.
   * @returns The count of the hand.
   */
  get_hand_count: () => [number, number];
  /**
   * Gets the current status of the player.
   * @returns The current status of the player.
   */
  get_status: () => PlayerStatus;
  /**
   * Sets the status of the player.
   * @param newStatus - The new status of the player.
   */
  set_status: (newStatus: PlayerStatus) => void;
  /**
   * Gets the current hand of the player.
   * @returns The current hand of the player.
   */
  get_hand: () => (CardPair[] | null)[];
  /**
   * Sets the hand of the player.
   * @param newHand - The new hand of the player.
   */
  set_hand: (newHand: (CardPair[] | null)[]) => void;
}

/**
 * Creates a new player.
 * @param user_ID - The ID of the user.
 * @param status - The status of the player. Defaults to 'Pending'.
 * @param hand - The hand of the player. Defaults to an empty array.
 * @returns The new player.
 */
export const createPlayer = (
  user_ID: number,
  status: PlayerStatus = 'Active',
  hand: (CardPair[] | null)[] = [null]
): Player => {
  /**
   * Takes an action.
   * @param action - The action to take.
   * @returns The action taken.
   */
  const take_action = (action: BlackJackAction): BlackJackAction => {
    return action;
  };

  /**
   * Gets the ID of the user.
   * @returns The ID of the user.
   */
  const get_user_ID = (): number => {
    return user_ID;
  };

  /**
   * Calculates the count of the player's hand.
   * The count is returned as a tuple, where the first element is the hard count
   * and the second element is the soft count (if applicable).
   * A soft count occurs when the hand contains an Ace counted as 11.
   * 
   * @returns A tuple containing the hard and soft counts of the hand.
   */
  const get_hand_count = (): [number, number] => {
    if (!hand[0]) return [0, 0]; // Return zero counts if the hand is empty

    let softCount = 0;
    let hasAce = false;

    for (const card of hand[0]) {
      if (card.card === 'A') {
        // Count Ace as 11 initially
        softCount += 11;
        hasAce = true;
      } else if (['K', 'Q', 'J'].includes(card.card) || card.card === '10') {
        // Face cards and 10 are worth 10 points
        softCount += 10;
      } else {
        // Other cards are worth their numeric value
        softCount += parseInt(card.card, 10);
      }
    }

    // Adjust the hard count if soft count exceeds 21 and contains an Ace
    const hardCount = hasAce && softCount > 21 ? softCount - 10 : softCount;
    // Return both counts; soft count is 0 if no Ace is present
    return hasAce ? [hardCount, softCount] : [hardCount, 0];
  };

  /**
   * Gets the current status of the player.
   * @returns The current status of the player.
   */
  const get_status = (): PlayerStatus => {
    return status;
  };

  /**
   * Sets the status of the player.
   * @param newStatus - The new status of the player.
   */
  const set_status = (newStatus: PlayerStatus): void => {
    status = newStatus;
  };

  /**
   * Gets the current hand of the player.
   * @returns The current hand of the player.
   */
  const get_hand = (): (CardPair[] | null)[] => {
    return hand;
  };

  /**
   * Sets the hand of the player.
   * @param newHand - The new hand of the player.
   */
  const set_hand = (newHand: (CardPair[] | null)[]): void => {
    hand = newHand;
  };

  return {
    hand,
    status,
    user_ID,
    take_action,
    get_user_ID,
    get_hand_count,
    get_status,
    set_status,
    get_hand,
    set_hand,
  };
};
