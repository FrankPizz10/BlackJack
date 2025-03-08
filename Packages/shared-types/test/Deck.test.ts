import { createDeck } from '../src/Game/Deck.ts';
import { mockContextDeck } from './mocks/mockContextDeck.ts';

jest.mock('../src/Game/Deck.ts', () => ({
  createDeck: jest.fn(() => mockContextDeck.createDeck()),
}));

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.resetAllMocks();
});

describe('Deck Operations', () => {
  let deck;

  beforeEach(() => {
    deck = createDeck();
  });

  it('should create a full deck with baseDeck and currentDeck populated', () => {
    expect(deck.baseDeck.length).toBe(52);
    expect(deck.currentDeck.length).toBe(52);
    expect(deck.numDecks).toBe(1);
  });

  it('should have all cards with a suit and value', () => {
    deck.baseDeck.forEach((card) => {
      expect(card.suit).toBeDefined();
      expect(card.value).toBeDefined();
      expect(typeof card.faceUp).toBe('boolean');
    });
  });

  it('should create a deck with valid CardValueType and Suit', () => {
    deck.baseDeck.forEach((card) => {
      expect(Object.values(mockContextDeck.createDeck().baseDeck[0].suit)).toContain(card.suit);
      expect(Object.values(mockContextDeck.createDeck().baseDeck[0].value)).toContain(card.value);
    });
  });
});
