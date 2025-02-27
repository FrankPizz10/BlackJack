import { Card } from './Card';
import { Suit } from './Suit';
import { CardValue } from './CardValue';

export type Deck = Readonly<{
  baseDeck: ReadonlyArray<Card>;
  currentDeck: ReadonlyArray<Card>;
  numDecks: number;
}>;

export const generateBaseDeck = (): Card[] => {
  const suits: Suit[] = ['H', 'D', 'C', 'S'];
  const cards: CardValue[] = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
    'A',
  ];
  const faceUp = false;
  return suits.flatMap((suit) => cards.map((card) => ({ suit, card, faceUp })));
};

export const createDeck = (numDecks: number = 1): Deck => {
  const baseDeck = Array(numDecks)
    .fill(null)
    .flatMap(() => generateBaseDeck());

  // Insert the cut card at a random position
  const cutCard: Card = { suit: 'CUT', card: '1', faceUp: false };
  const randomIndex = Math.floor(Math.random() * (baseDeck.length + 1));
  baseDeck.splice(randomIndex, 0, cutCard);

  return { baseDeck, currentDeck: [...baseDeck], numDecks };
};

export const shuffle = (deck: Deck): Deck => {
  const shuffledDeck = [...deck.baseDeck];
  for (let i = shuffledDeck.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffledDeck[i], shuffledDeck[randomIndex]] = [
      shuffledDeck[randomIndex],
      shuffledDeck[i],
    ];
  }
  return { ...deck, currentDeck: [...shuffledDeck] };
};

export const draw = (deck: Deck): { card: Card; deck: Deck } | null => {
  if (deck.currentDeck.length === 0) {
    return null;
  }
  return {
    card: deck.currentDeck[0], // Grabs the top card
    deck: { ...deck, currentDeck: deck.currentDeck.slice(1) },
  };
};
