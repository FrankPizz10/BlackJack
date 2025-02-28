export const Suit = {
  Hearts: 'H',
  Diamonds: 'D',
  Clubs: 'C',
  Spades: 'S',
  Cut: 'CUT',
  Hidden: 'HIDDEN',
} as const;

export type Suit = (typeof Suit)[keyof typeof Suit];
