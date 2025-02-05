import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

type Context = {
  prisma: PrismaClient;
  redis: Redis;
};

const prisma = new PrismaClient();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not defined');
}

const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });

export const createContext = (overrides?: Partial<Context>): Context => ({
  prisma: overrides?.prisma || prisma,
  redis: overrides?.redis || redis,
});

export type AppContext = ReturnType<typeof createContext>;
