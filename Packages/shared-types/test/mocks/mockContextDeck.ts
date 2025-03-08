import { createDeck } from '../../src/Game/Deck.ts';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Suit } from '../../src/Game/Suit.ts';
import { CardValueType } from '../../src/Game/CardValue.ts';

export type MockContextDeck = DeepMockProxy<{ createDeck: typeof createDeck }>;
export const mockContextDeck: MockContextDeck = mockDeep<{ createDeck: typeof createDeck }>();

// Properly structuring the mock return value based on Deck.ts expectations
mockContextDeck.createDeck.mockReturnValue({
  baseDeck: [...Array(52)].map((_, i) => ({
    suit: Object.values(Suit)[i % 4] as Suit, // Assigning suits dynamically
    value: (i % 13 + 1) as unknown as CardValueType, // Explicit casting to fix TypeScript conversion issue
    faceUp: true,
  })),
  currentDeck: [...Array(52)].map((_, i) => ({
    suit: Object.values(Suit)[i % 4] as Suit,
    value: (i % 13 + 1) as unknown as CardValueType, // Explicit casting to fix TypeScript conversion issue
    faceUp: true,
  })),
  numDecks: 1,
});