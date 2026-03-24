import redis from './_lib/redis.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adminToken } = req.body;
    if (!adminToken) {
      return res.status(400).json({ error: 'Missing adminToken' });
    }

    const eventId = await redis.get(`wheel:admin:${adminToken}`);
    if (!eventId) return res.status(403).json({ error: 'אין הרשאה' });

    // Get all children
    const childrenRaw = await redis.hgetall(`wheel:event:${eventId}:children`) || {};

    // Reset each child's state
    const resetEntries = {};
    const childIds = [];
    for (const [id, val] of Object.entries(childrenRaw)) {
      const child = typeof val === 'string' ? JSON.parse(val) : val;
      resetEntries[id] = JSON.stringify({ name: child.name, hasSpun: false, isReceiver: false });
      childIds.push(id);
    }

    if (childIds.length === 0) {
      return res.status(400).json({ error: 'אין ילדים באירוע' });
    }

    // Reset children hash
    await redis.hset(`wheel:event:${eventId}:children`, resetEntries);

    // Clear and rebuild canReceive and canSpin sets
    await redis.del(`wheel:event:${eventId}:canReceive`);
    await redis.del(`wheel:event:${eventId}:canSpin`);
    await redis.sadd(`wheel:event:${eventId}:canReceive`, ...childIds);
    await redis.sadd(`wheel:event:${eventId}:canSpin`, ...childIds);

    // Clear assignments
    await redis.del(`wheel:event:${eventId}:assignments`);

    // Clear any stale spin lock
    await redis.del(`wheel:event:${eventId}:spinlock`);

    res.json({ ok: true });
  } catch (err) {
    console.error('reset handler error:', err);
    res.status(500).json({ error: 'שגיאה פנימית בשרת' });
  }
}
