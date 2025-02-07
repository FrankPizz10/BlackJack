import { Card } from './Card';
import { Suit } from './Suit';
import { CardValue } from './CardValue';

export type Deck = {
  baseDeck: Card[];
  currentDeck: Card[];
  numDecks: number;
};

export const generateBaseDeck = (): Card[] => {
  const suits: Suit[] = ['H', 'D', 'C', 'S'];
  const cards: CardValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const faceUp = false;
  return suits.flatMap((suit) => cards.map((card) => ({ suit, card, faceUp })));
};

export const createDeck = (numDecks: number = 1): Deck => {
  const baseDeck = Array(numDecks).fill(null).flatMap(() => generateBaseDeck());
  return { baseDeck, currentDeck: [...baseDeck], numDecks };
};

export const shuffle = (deck: Deck): void => {
  for (let i = deck.currentDeck.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [deck.currentDeck[i], deck.currentDeck[randomIndex]] = [deck.currentDeck[randomIndex], deck.currentDeck[i]];
  }
};

export const draw = (deck: Deck): Card | null => {
  return deck.currentDeck.length > 0 ? deck.currentDeck.shift() || null : null;
};
