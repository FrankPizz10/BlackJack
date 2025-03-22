import { computeHandCount } from '../src/Game/Hand';
import { isBlackjack, Card } from '../src/Game/Card';
import { mockContextHand } from './mocks/mockContextHand';
import { Suit } from '../src/Game/Suit';
import { CardValueType } from '../src/Game/CardValue';

jest.mock('../src/Game/Hand', () => ({
  computeHandCount: jest.fn((hand) => mockContextHand.computeHandCount(hand)),
}));

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.resetAllMocks();
});

describe('Hand Calculation', () => {
  it('should calculate correct hand total without Aces', () => {
    const hand: ReadonlyArray<Card> = [
      { suit: Suit.Hearts, value: '10', faceUp: true },
      { suit: Suit.Spades, value: '5', faceUp: true }
    ];
    expect(computeHandCount(hand)).toBe(15);
  });

  it('should return 0 for an empty hand', () => {
    const hand: ReadonlyArray<Card> = [];
    expect(computeHandCount(hand)).toBe(0);
  });

  it('should recognize a blackjack (Ace + 10-point card)', () => {
    const hand: ReadonlyArray<Card> = [
      { suit: Suit.Spades, value: 'A', faceUp: true },
      { suit: Suit.Diamonds, value: 'K', faceUp: true }
    ];
    expect(computeHandCount(hand)).toBe(21);
  });

  it('should adjust Aces correctly', () => {
    const hand: ReadonlyArray<Card> = [
      { suit: Suit.Diamonds, value: 'A', faceUp: true },
      { suit: Suit.Clubs, value: 'A', faceUp: true },
      { suit: Suit.Spades, value: '9', faceUp: true }
    ];
    expect(computeHandCount(hand)).toBe(21);
  });

  it('should ignore HIDDEN cards when computing hand count', () => {
    const hand: ReadonlyArray<Card> = [
      { suit: Suit.Hidden, value: 'HIDDEN', faceUp: false },
      { suit: Suit.Hearts, value: '10', faceUp: true }
    ];
    expect(computeHandCount(hand)).toBe(10);
  });

  it('should not count CUT cards when computing hand count', () => {
    const hand: ReadonlyArray<Card> = [
      { suit: Suit.Cut, value: 'CUT', faceUp: false },
      { suit: Suit.Spades, value: '7', faceUp: true }
    ];
    expect(computeHandCount(hand)).toBe(7);
  });
});

describe('Blackjack Detection', () => {
  it('should detect a valid blackjack (Ace + Face Card)', () => {
    const hand: ReadonlyArray<Card> = [
      { suit: Suit.Hearts, value: 'A', faceUp: true },
      { suit: Suit.Clubs, value: 'K', faceUp: true }
    ];
    expect(isBlackjack(hand)).toBe(true);
  });

  it('should return false if more than two cards are in hand', () => {
    const hand: ReadonlyArray<Card> = [
      { suit: Suit.Diamonds, value: 'A', faceUp: true },
      { suit: Suit.Spades, value: 'K', faceUp: true },
      { suit: Suit.Clubs, value: '2', faceUp: true }
    ];
    expect(isBlackjack(hand)).toBe(false);
  });

  it('should return false if hand value is 21 but has more than two cards', () => {
    const hand: ReadonlyArray<Card> = [
      { suit: Suit.Hearts, value: '7', faceUp: true },
      { suit: Suit.Spades, value: '7', faceUp: true },
      { suit: Suit.Diamonds, value: '7', faceUp: true }
    ];
    expect(isBlackjack(hand)).toBe(false);
  });

  it('should return false if hand does not total 21', () => {
    const hand: ReadonlyArray<Card> = [
      { suit: Suit.Clubs, value: '5', faceUp: true },
      { suit: Suit.Diamonds, value: 'K', faceUp: true }
    ];
    expect(isBlackjack(hand)).toBe(false);
  });
});
