import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import Redis from 'ioredis';
import { createContext } from '../../src/context';

// Ensure Prisma is fully mocked
jest.mock('@prisma/client', () => ({
  __esModule: true,
  PrismaClient: jest.fn(() => mockDeep<PrismaClient>()),
}));

// Mock Redis completely
jest.mock('ioredis', () => {
  const mockRedisClient = mockDeep<Redis>();
  return jest.fn(() => mockRedisClient);
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.resetAllMocks();
});

// Create mock instances
const prismaMock = new PrismaClient() as unknown as DeepMockProxy<PrismaClient>;
const redisMock = new Redis() as unknown as DeepMockProxy<Redis>;
const redisSubMock = new Redis() as unknown as DeepMockProxy<Redis>;

// Create a test context
export const mockContext = createContext({
  prisma: prismaMock,
  redis: redisMock,
  redisSub: redisSubMock,
});

export type MockContext = typeof mockContext;
