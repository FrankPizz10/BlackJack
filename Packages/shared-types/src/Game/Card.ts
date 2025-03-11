import { Suit } from './Suit';
import { CardValueType } from './CardValue';
import { computeHandCount } from './Hand';

export type Card = Readonly<{
  suit: Readonly<Suit>;
  value: CardValueType;
  faceUp: boolean;
}>;

export const isBlackjack = (cards: ReadonlyArray<Card>): boolean => {
  return cards.length === 2 && computeHandCount(cards) === 21;
};
