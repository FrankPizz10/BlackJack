import { Card } from './Card';

/**
 * Represents a player's hand
 * @type {Hand}
 * @property {ReadonlyArray<Card>} cards - Array of cards in the hand
 * @property {number} bet - Amount bet on the hand
 * @property {boolean} isDone - Whether the hand is done
 * @property {boolean} isWon - Whether the hand is won
 * @property {boolean} isPush - Whether the hand is a push
 * @property {boolean} isBlackjack - Whether the hand is a blackjack
 *
 */
export type Hand = Readonly<{
  cards: ReadonlyArray<Card>;
  bet: number;
  isDone: boolean;
  isWon?: boolean;
  isPush?: boolean;
  isBlackjack?: boolean;
}>;

export const computeHandCount = (cards: ReadonlyArray<Card>): number => {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.value === 'A') {
      total += 11;
      aces++;
    } else if (['K', 'Q', 'J', '10'].includes(card.value)) {
      total += 10;
    } else if (card.value === 'HIDDEN') {
      total += 0;
    } else {
      total += parseInt(card.value, 10);
    }
  }

  // Adjust for Aces if the total exceeds 21
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
};
