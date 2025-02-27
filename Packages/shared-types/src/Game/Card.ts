import { Suit } from './Suit';
import { CardValueType } from './CardValue';

export type Card = Readonly<{
  suit: Readonly<Suit>;
  value: CardValueType;
  faceUp: boolean;
}>;
