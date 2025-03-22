import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { computeHandCount } from '../../src/Game/Hand.ts';

export type MockContextHand = DeepMockProxy<{ computeHandCount: typeof computeHandCount }>;
export const mockContextHand: MockContextHand = mockDeep<{ computeHandCount: typeof computeHandCount }>();

mockContextHand.computeHandCount.mockImplementation(computeHandCount);
