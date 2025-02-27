export const CardValue = {
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  J: 'J',
  Q: 'Q',
  K: 'K',
  A: 'A',
  HIDDEN: 'HIDDEN',
  CUT: 'CUT',
} as const;

export type CardValueType = (typeof CardValue)[keyof typeof CardValue];
