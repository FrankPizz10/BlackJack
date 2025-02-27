import { Suit } from './Suit';
import { CardValue } from './CardValue';

export type Card = Readonly<{
  suit: Readonly<Suit>;
  card: Readonly<CardValue>;
  faceUp: boolean;
}>;
