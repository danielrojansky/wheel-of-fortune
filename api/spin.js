import redis from './_lib/redis.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shareToken, giverId } = req.body;
  if (!shareToken || !giverId) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const eventId = await redis.get(`wheel:share:${shareToken}`);
  if (!eventId) return res.status(404).json({ error: 'אירוע לא נמצא' });

  // Check giver can spin
  const canSpin = await redis.sismember(`wheel:event:${eventId}:canSpin`, giverId);
  if (!canSpin) {
    return res.status(400).json({ error: 'ילד/ה זו כבר סובב/ה את הגלגל' });
  }

  // Acquire spin lock
  const lockKey = `wheel:event:${eventId}:spinlock`;
  const locked = await redis.set(lockKey, giverId, { nx: true, ex: 30 });
  if (!locked) {
    return res.status(409).json({ error: 'מישהו אחר מסובב כרגע, נסו שוב בעוד רגע' });
  }

  try {
    // Remove giver from canSpin
    const removed = await redis.srem(`wheel:event:${eventId}:canSpin`, giverId);
    if (!removed) {
      return res.status(400).json({ error: 'ילד/ה זו כבר סובב/ה את הגלגל' });
    }

    // Temporarily remove giver from canReceive to prevent self-selection
    const wasInReceive = await redis.srem(`wheel:event:${eventId}:canReceive`, giverId);

    // Pick a random receiver
    const receiverId = await redis.srandmember(`wheel:event:${eventId}:canReceive`);

    if (!receiverId) {
      // No receivers available - restore state
      await redis.sadd(`wheel:event:${eventId}:canSpin`, giverId);
      if (wasInReceive) {
        await redis.sadd(`wheel:event:${eventId}:canReceive`, giverId);
      }
      return res.status(400).json({ error: 'אין ילדים זמינים לבחירה' });
    }

    // Remove receiver from canReceive
    await redis.srem(`wheel:event:${eventId}:canReceive`, receiverId);

    // Re-add giver to canReceive if they were there (they can still receive gifts)
    if (wasInReceive) {
      await redis.sadd(`wheel:event:${eventId}:canReceive`, giverId);
    }

    // Update children hash
    const giverRaw = await redis.hget(`wheel:event:${eventId}:children`, giverId);
    const receiverRaw = await redis.hget(`wheel:event:${eventId}:children`, receiverId);
    const giver = typeof giverRaw === 'string' ? JSON.parse(giverRaw) : giverRaw;
    const receiver = typeof receiverRaw === 'string' ? JSON.parse(receiverRaw) : receiverRaw;

    giver.hasSpun = true;
    receiver.isReceiver = true;

    await redis.hset(`wheel:event:${eventId}:children`, {
      [giverId]: JSON.stringify(giver),
      [receiverId]: JSON.stringify(receiver),
    });

    // Record assignment
    await redis.rpush(`wheel:event:${eventId}:assignments`, JSON.stringify({
      giverId,
      giverName: giver.name,
      receiverId,
      receiverName: receiver.name,
      createdAt: Date.now(),
    }));

    res.json({
      giverId,
      giverName: giver.name,
      receiverId,
      receiverName: receiver.name,
    });
  } finally {
    // Always release lock
    await redis.del(lockKey);
  }
}
