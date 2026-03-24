import redis from './_lib/redis.js';

export default async function handler(req, res) {
  try {
    await redis.ping();
    res.json({ ok: true, redis: 'connected' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, stack: err.stack });
  }
}
