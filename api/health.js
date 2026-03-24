import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  try {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    await redis.ping();
    res.json({ ok: true, redis: 'connected' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
