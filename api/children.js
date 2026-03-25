import redis from './_lib/redis.js';
import { generateChildId } from './_lib/tokens.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'POST') {
    return addChild(req, res);
  }
  if (req.method === 'DELETE') {
    return removeChild(req, res);
  }
  if (req.method === 'PATCH') {
    return removeAllChildren(req, res);
  }
  res.status(405).json({ error: 'Method not allowed' });
}

async function addChild(req, res) {
  const { adminToken, name } = req.body;
  if (!adminToken || !name?.trim()) {
    return res.status(400).json({ error: 'נדרש שם הילד/ה' });
  }

  const eventId = await redis.get(`wheel:admin:${adminToken}`);
  if (!eventId) return res.status(403).json({ error: 'אין הרשאה' });

  const childId = generateChildId();
  await redis.hset(`wheel:event:${eventId}:children`, {
    [childId]: JSON.stringify({ name: name.trim(), hasSpun: false, isReceiver: false }),
  });
  await redis.sadd(`wheel:event:${eventId}:canReceive`, childId);
  await redis.sadd(`wheel:event:${eventId}:canSpin`, childId);

  res.status(201).json({ childId, name: name.trim() });
}

async function removeChild(req, res) {
  const { adminToken, childId } = req.body;
  if (!adminToken || !childId) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const eventId = await redis.get(`wheel:admin:${adminToken}`);
  if (!eventId) return res.status(403).json({ error: 'אין הרשאה' });

  const raw = await redis.hget(`wheel:event:${eventId}:children`, childId);
  if (!raw) return res.status(404).json({ error: 'ילד/ה לא נמצא/ה' });

  const child = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (child.hasSpun || child.isReceiver) {
    return res.status(400).json({ error: 'לא ניתן להסיר ילד/ה שכבר השתתפ/ה' });
  }

  await redis.hdel(`wheel:event:${eventId}:children`, childId);
  await redis.srem(`wheel:event:${eventId}:canReceive`, childId);
  await redis.srem(`wheel:event:${eventId}:canSpin`, childId);

  res.json({ ok: true });
}

async function removeAllChildren(req, res) {
  const { adminToken } = req.body;
  if (!adminToken) {
    return res.status(400).json({ error: 'Missing adminToken' });
  }

  const eventId = await redis.get(`wheel:admin:${adminToken}`);
  if (!eventId) return res.status(403).json({ error: 'אין הרשאה' });

  // Delete all children-related keys
  await Promise.all([
    redis.del(`wheel:event:${eventId}:children`),
    redis.del(`wheel:event:${eventId}:canReceive`),
    redis.del(`wheel:event:${eventId}:canSpin`),
    redis.del(`wheel:event:${eventId}:assignments`),
    redis.del(`wheel:event:${eventId}:spinlock`),
  ]);

  res.json({ ok: true });
}
