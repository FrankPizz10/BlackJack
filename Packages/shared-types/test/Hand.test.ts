import { computeHandCount } from '../src/Game/Hand.ts';
import { mockContextHand } from './mocks/mockContextHand.ts';
import { Suit } from '../src/Game/Suit.ts';
import { CardValueType } from '../src/Game/CardValue.ts';

jest.mock('../src/Game/Hand.ts', () => ({
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
    const hand = [{ suit: Suit.Hearts, value: '10' as CardValueType, faceUp: true }, { suit: Suit.Spades, value: '5' as CardValueType, faceUp: true }];
    expect(computeHandCount(hand)).toBe(15);
  });

  it('should calculate correct hand total with Aces as 11', () => {
    const hand = [{ suit: Suit.Diamonds, value: 'A' as CardValueType, faceUp: true }, { suit: Suit.Clubs, value: '8' as CardValueType, faceUp: true }];
    expect(computeHandCount(hand)).toBe(19);
  });

  it('should adjust Aces to 1 if total exceeds 21', () => {
    const hand = [
      { suit: Suit.Hearts, value: 'A' as CardValueType, faceUp: true },
      { suit: Suit.Spades, value: 'K' as CardValueType, faceUp: true },
      { suit: Suit.Diamonds, value: '5' as CardValueType, faceUp: true },
    ];
    expect(computeHandCount(hand)).toBe(16);
  });

  it('should count face cards as 10', () => {
    const hand = [{ suit: Suit.Clubs, value: 'K' as CardValueType, faceUp: true }, { suit: Suit.Hearts, value: 'Q' as CardValueType, faceUp: true }];
    expect(computeHandCount(hand)).toBe(20);
  });

  it('should return 0 for an empty hand', () => {
    const hand = [];
    expect(computeHandCount(hand)).toBe(0);
  });

  it('should properly handle multiple Aces', () => {
    const hand = [
      { suit: Suit.Diamonds, value: 'A' as CardValueType, faceUp: true },
      { suit: Suit.Clubs, value: 'A' as CardValueType, faceUp: true },
      { suit: Suit.Spades, value: '9' as CardValueType, faceUp: true },
    ];
    expect(computeHandCount(hand)).toBe(21);
  });

  it('should handle mixed hands correctly', () => {
    const hand = [
      { suit: Suit.Hearts, value: 'J' as CardValueType, faceUp: true },
      { suit: Suit.Diamonds, value: '3' as CardValueType, faceUp: true },
      { suit: Suit.Spades, value: '5' as CardValueType, faceUp: true },
    ];
    expect(computeHandCount(hand)).toBe(18);
  });

  it('should not count HIDDEN cards', () => {
    const hand = [
      { suit: Suit.Clubs, value: 'HIDDEN' as CardValueType, faceUp: false },
      { suit: Suit.Hearts, value: '10' as CardValueType, faceUp: true },
      { suit: Suit.Diamonds, value: '5' as CardValueType, faceUp: true },
    ];
    expect(computeHandCount(hand)).toBe(15);
  });
});