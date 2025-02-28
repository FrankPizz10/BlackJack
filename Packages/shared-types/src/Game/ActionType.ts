export const ActionType = {
  None: 'None',
  Hit: 'Hit',
  Stand: 'Stand',
  DoubleDown: 'Double Down',
  Split: 'Split',
  Surrender: 'Surrender',
  Deal: 'Deal',
  Dealer: 'Dealer',
  CheckHand: 'CheckHand',
  Bet: 'Bet',
  ForceShuffle: 'ForceShuffle',
  Shuffle: 'Shuffle',
  Reset: 'Reset',
} as const;

export type ActionType = (typeof ActionType)[keyof typeof ActionType];
