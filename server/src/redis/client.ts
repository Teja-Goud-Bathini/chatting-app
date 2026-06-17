import Redis from 'ioredis';

export const redisPublisher = new Redis(process.env.REDIS_URL!);
export const redisSubscriber = new Redis(process.env.REDIS_URL!);
export const redisCache = new Redis(process.env.REDIS_URL!);

export async function connectRedis() {
  await redisPublisher.ping();
  console.log('Redis connected');
}

// ─── Cache helpers ────────────────────────────────────────────
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await redisCache.get(key);
  if (cached) return JSON.parse(cached) as T;

  const result = await fn();
  await redisCache.setex(key, ttlSeconds, JSON.stringify(result));
  return result;
}

// Example usage:
// const user = await withCache(`user:${id}`, 300, () =>
//   db.user.findUnique({ where: { id } })
// );
