import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { RedisClientType } from 'redis';
import { createContext } from '../../src/context';

jest.mock('@prisma/client', () => ({
  __esModule: true,
  PrismaClient: jest.fn(() => mockDeep<PrismaClient>()),
}));

jest.mock('redis', () => {
  const mockRedisClient = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  };
  return {
    createClient: jest.fn(() => mockRedisClient),
  };
});

afterEach(() => {
  jest.clearAllMocks(); // Clears all mocks after each test
});

afterAll(async () => {
  jest.resetAllMocks(); // Resets all mocks after all tests
  if (mockContext.redis.quit) {
    await mockContext.redis.quit();
  }
});

// Create a mock context for testing
const context = createContext();
const prismaMock = context.prisma as unknown as DeepMockProxy<PrismaClient>;
const redisMock = context.redis as unknown as DeepMockProxy<RedisClientType>;

type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
  redis: DeepMockProxy<RedisClientType>;
};

const mockContext: MockContext = {
  prisma: prismaMock,
  redis: redisMock,
};

export default mockContext;

