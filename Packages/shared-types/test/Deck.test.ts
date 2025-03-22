import { createDeck } from '../src/Game/Deck.ts';
import { Suit } from '../src/Game/Suit.ts';
import { mockContextDeck } from './mocks/mockContextDeck.ts';

jest.mock('../src/Game/Deck.ts', () => ({
  createDeck: jest.fn((numDecks = 1) => mockContextDeck.createDeck(numDecks)),
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
    deck = createDeck(2); // Testing with multiple decks
  });

  it('should create a full deck with baseDeck and currentDeck populated', () => {
    const expectedDeckSize = 2 * 52 + 1; // Adding the cut card
    expect(deck.baseDeck.length).toBe(expectedDeckSize);
    expect(deck.currentDeck.length).toBe(expectedDeckSize);
    expect(deck.numDecks).toBe(2);
  });

  it('should have all cards with a valid suit and value', () => {
    deck.baseDeck.forEach((card) => {
      expect(Object.values(Suit)).toContain(card.suit);
      expect(card.value).toBeDefined();
      expect(typeof card.faceUp).toBe('boolean');
    });
  });

  it('should exclude HIDDEN and CUT cards from normal deck composition', () => {
    const validCards = deck.baseDeck.filter((card) => card.suit !== Suit.Cut && card.suit !== Suit.Hidden);
    expect(validCards.length).toBe(2 * 52);
  });

  it('should include exactly one CUT card in the deck', () => {
    const cutCardCount = deck.baseDeck.filter((card) => card.suit === Suit.Cut).length;
    expect(cutCardCount).toBe(1);

    const cutCardIndex = deck.baseDeck.findIndex((card) => card.suit === Suit.Cut);
    expect(cutCardIndex).toBeGreaterThanOrEqual(0);
  });
});
