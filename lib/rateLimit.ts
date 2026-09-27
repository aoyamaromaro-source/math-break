import { Redis } from "@upstash/redis";

const DAILY_LIMIT = 3;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

let _redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!_redis) {
    _redis = Redis.fromEnv();
  }
  return _redis;
}

function getJstDateKey(): string {
  return new Date(Date.now() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

function secondsUntilNextJstMidnight(): number {
  const now = Date.now();
  const jstNow = new Date(now + JST_OFFSET_MS);
  const nextJstMidnightUtc = Date.UTC(
    jstNow.getUTCFullYear(),
    jstNow.getUTCMonth(),
    jstNow.getUTCDate() + 1,
    0,
    0,
    0
  );
  const nextMidnightRealTime = nextJstMidnightUtc - JST_OFFSET_MS;
  return Math.max(1, Math.ceil((nextMidnightRealTime - now) / 1000));
}

export async function consumeDailyOcrQuota(
  ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedisClient();
  const key = `ocr-usage:${ip}:${getJstDateKey()}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, secondsUntilNextJstMidnight());
  }

  return { allowed: count <= DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - count) };
}
