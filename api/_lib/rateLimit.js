import { Ratelimit } from '@upstash/ratelimit';
import redis from './redis.js';

export const spinLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1m'),
  prefix: 'wheel:rl:spin',
  analytics: false,
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1m'),
  prefix: 'wheel:rl:api',
  analytics: false,
});

export async function checkLimit(limiter, identifier, res) {
  try {
    const { success, reset } = await limiter.limit(identifier);
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({ error: 'יותר מדי בקשות. נסו שוב בעוד מספר שניות.' });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
