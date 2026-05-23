import { Redis } from 'ioredis';
import RedisMock from 'ioredis-mock';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;

// Factory to create Redis client instances (supports real server & mock fallback)
export const createRedisConnection = (): Redis => {
  if (redisUrl) {
    return new Redis(redisUrl, {
      maxRetriesPerRequest: null // Required by BullMQ
    });
  } else {
    // Cast to any to instantiate the mock
    return new (RedisMock as any)();
  }
};

// Global default Redis client
const redisClient = createRedisConnection();

console.log(redisUrl ? `Connected to real Redis at ${redisUrl}` : 'Initialized in-memory Redis Mock (ioredis-mock).');

export default redisClient;
