import { createDeck, generateBaseDeck } from '../../src/Game/Deck.ts';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

export type MockContextDeck = DeepMockProxy<{ createDeck: typeof createDeck }>;
export const mockContextDeck: MockContextDeck = mockDeep<{ createDeck: typeof createDeck }>();

mockContextDeck.createDeck.mockImplementation((numDecks = 1) => {
  const baseDeck = Array(numDecks).fill(null).flatMap(() => generateBaseDeck());
  return {
    baseDeck,
    currentDeck: [...baseDeck],
    numDecks,
  };
});
