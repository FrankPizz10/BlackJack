import { Suit } from './Suit';
import { CardValue } from './CardValue';

export interface Card {
  suit: Suit;
  card: CardValue;
}
