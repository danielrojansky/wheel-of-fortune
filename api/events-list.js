import redis from './_lib/redis.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all event IDs from the master set
    let eventIds = await redis.smembers('wheel:events') || [];

    // Migration: if the master set is empty, scan Redis for existing events
    // and populate the set for future requests
    if (eventIds.length === 0) {
      const discovered = await discoverEvents();
      if (discovered.length > 0) {
        await redis.sadd('wheel:events', ...discovered);
        eventIds = discovered;
      }
    }

    if (eventIds.length === 0) {
      return res.json({ events: [] });
    }

    // Fetch metadata for all events in parallel
    const events = await Promise.all(
      eventIds.map(async (eventId) => {
        try {
          const meta = await redis.hgetall(`wheel:event:${eventId}`);
          if (!meta || !meta.name) {
            // Clean up stale entry from the set
            await redis.srem('wheel:events', eventId);
            return null;
          }

          const childrenRaw = await redis.hgetall(`wheel:event:${eventId}:children`) || {};
          const assignmentsRaw = await redis.lrange(`wheel:event:${eventId}:assignments`, 0, -1) || [];

          const childrenCount = Object.keys(childrenRaw).length;
          const completedCount = assignmentsRaw.length;

          return {
            eventId,
            eventName: meta.name,
            adminToken: meta.adminToken,
            shareToken: meta.shareToken,
            childrenCount,
            completedCount,
            createdAt: meta.createdAt,
          };
        } catch {
          return null;
        }
      })
    );

    // Filter out nulls (deleted/corrupted events) and sort by creation date (newest first)
    const validEvents = events
      .filter(Boolean)
      .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

    res.json({ events: validEvents });
  } catch (err) {
    console.error('events-list handler error:', err);
    res.status(500).json({ error: 'שגיאה פנימית בשרת' });
  }
}

// Discover existing events by scanning for wheel:admin:* keys
async function discoverEvents() {
  const eventIds = [];
  let cursor = 0;
  do {
    const result = await redis.scan(cursor, { match: 'wheel:event:*', count: 100 });
    cursor = result[0];
    const keys = result[1];
    for (const key of keys) {
      // Match only the base event keys like wheel:event:ABC123 (no colons after the eventId)
      const match = key.match(/^wheel:event:([^:]+)$/);
      if (match) {
        eventIds.push(match[1]);
      }
    }
  } while (cursor !== 0 && cursor !== '0');
  return eventIds;
}
