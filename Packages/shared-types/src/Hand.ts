import { Card } from './Card';

export type Hand = Readonly<{
  cards: Card[];
  bet: number;
  isCurrentHand: boolean;
  isDone: boolean;
  isWon?: boolean;
  isPush?: boolean;
  isBlackjack?: boolean;
}>;

export const computeHandCount = (cards: ReadonlyArray<Card>): number => {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.card === 'A') {
      total += 11;
      aces++;
    } else if (['K', 'Q', 'J', '10'].includes(card.card)) {
      total += 10;
    } else if (card.card === 'HIDDEN') {
      total += 0;
    } else {
      total += parseInt(card.card, 10);
    }
  }

  // Adjust for Aces if the total exceeds 21
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
};

export const testHand = (): void => {
  console.log('Test');
};
