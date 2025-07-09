import { BoardCard } from '../components/playerposition';
import { Card } from '@shared-types/Game/Card';

export const convertCardsToBoardCards = (
  cards: ReadonlyArray<Card>
): BoardCard[] => {
  return cards.map((card) => ({
    suit: card.suit,
    value: card.value,
    faceUp: card.faceUp,
    image: getImage(card),
    card: card,
  }));
};

export const getImage = (card: Card): string => {
  const suit = card.suit.toLowerCase();
  const value = card.value.toLowerCase();
  return `/cards/${suit}_${value}.png`;
};

