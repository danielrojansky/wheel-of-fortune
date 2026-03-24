import redis from './_lib/redis.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const eventId = await redis.get(`wheel:share:${token}`);
  if (!eventId) return res.status(404).json({ error: 'אירוע לא נמצא' });

  const raw = await redis.lrange(`wheel:event:${eventId}:assignments`, 0, -1) || [];
  const assignments = raw.map(a => typeof a === 'string' ? JSON.parse(a) : a);

  res.json({ assignments });
}
