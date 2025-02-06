import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

type Context = {
  prisma: PrismaClient;
  redis: Redis;
  redisSub: Redis;
};

const prisma = new PrismaClient();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not defined');
}

const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
const redisSub = redis.duplicate();

export const createContext = (overrides?: Partial<Context>): Context => ({
  prisma: overrides?.prisma || prisma,
  redis: overrides?.redis || redis,
  redisSub: overrides?.redisSub || redisSub,
});

export type AppContext = ReturnType<typeof createContext>;
