import { CardPair } from './CardPair';

export type Hand = {
  cards: CardPair[];
  bet: number;
};

/**
 * Creates a new hand for the game of Blackjack.
 * @returns A new `Hand` object.
 */
export const createHand = (): Hand => {
  let cards: CardPair[] = [];
  let bet: number = 0;

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
  };
};
