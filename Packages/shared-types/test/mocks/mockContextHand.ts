import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { computeHandCount } from '../../src/Game/Hand.ts';

export type MockContextHand = DeepMockProxy<{ computeHandCount: typeof computeHandCount }>;
export const mockContextHand: MockContextHand = mockDeep<{ computeHandCount: typeof computeHandCount }>();

mockContextHand.computeHandCount.mockImplementation((hand) => {
  let total = 0;
  let aces = 0;
  
  hand.forEach((card) => {
    if (card.value === 'A') {
      total += 11;
      aces++;
    } else if (['K', 'Q', 'J', '10'].includes(card.value)) {
      total += 10;
    } else {
      total += parseInt(card.value, 10) || 0;
    }
  });
  
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
});