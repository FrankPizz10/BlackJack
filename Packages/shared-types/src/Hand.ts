import { CardPair } from './CardPair';

export type Hand = {
  cards: CardPair[];
  bet: number;
  get_cards: () => CardPair[];
  set_cards: (newCards: CardPair[]) => void;
  get_bet: () => number;
  set_bet: (newBet: number) => void;
  get_hand_count: () => number;
};

/**
 * Creates a new hand for the game of Blackjack.
 * @returns A new `Hand` object.
 */
export const createHand = (): Hand => {
  let cards: CardPair[] = [];
  let bet: number = 0;

  /**
   * Gets the current cards in the player's hand.
   * @returns The current cards in the player's hand.
   */
  const get_cards = (): CardPair[] => cards;

  /**
   * Sets the current cards in the player's hand.
   * @param newCards - The new cards to set in the player's hand.
   */
  const set_cards = (newCards: CardPair[]): void => {
    cards = newCards;
  };

  /**
   * Gets the current bet of the player.
   * @returns The current bet of the player.
   */
  const get_bet = (): number => bet;

  /**
   * Sets the current bet of the player.
   * @param newBet - The new bet to set.
   */
  const set_bet = (newBet: number): void => {
    bet = newBet;
  };

  /**
   * Calculates the count of the player's hand.
   * The count is returned as a number, where an Ace can be counted as 11 or 1.
   * @returns The count of the player's hand.
   */
  const get_hand_count = (): number => {
    let softCount = 0;
    let hasAce = false;

    for (const card of cards) {
      if (card.card === 'A') {
        softCount += 11;
        hasAce = true;
      } else if (['K', 'Q', 'J'].includes(card.card) || card.card === '10') {
        softCount += 10;
      } else {
        softCount += parseInt(card.card, 10);
      }
    }

    return hasAce && softCount > 21 ? softCount - 10 : softCount;
  };

  return {
    cards,
    bet,
    get_cards,
    set_cards,
    get_bet,
    set_bet,
    get_hand_count,
  };
};
