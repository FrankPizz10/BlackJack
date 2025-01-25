import { PrismaClient } from '@prisma/client';
import { createClient, RedisClientType } from 'redis';

type Context = {
  prisma: PrismaClient;
  redis: RedisClientType;
};

const prisma = new PrismaClient();
const redis: RedisClientType = createClient({
  url: process.env.REDIS_URL,
});

redis.connect();

export const createContext = (): Context => ({
  prisma,
  redis,
});

export type AppContext = ReturnType<typeof createContext>;
