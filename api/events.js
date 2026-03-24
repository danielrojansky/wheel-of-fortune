import redis from './_lib/redis.js';
import { generateEventId, generateAdminToken, generateShareToken, generateChildId } from './_lib/tokens.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'POST') {
    return createEvent(req, res);
  }
  if (req.method === 'GET') {
    return getEvent(req, res);
  }
  res.status(405).json({ error: 'Method not allowed' });
}

async function createEvent(req, res) {
  const { name, children } = req.body;
  if (!name || !Array.isArray(children) || children.length < 2) {
    return res.status(400).json({ error: 'נדרש שם אירוע ולפחות 2 ילדים' });
  }

  const eventId = generateEventId();
  const adminToken = generateAdminToken();
  const shareToken = generateShareToken();

  // Store event metadata
  await redis.hset(`wheel:event:${eventId}`, {
    name,
    adminToken,
    shareToken,
    createdAt: Date.now().toString(),
  });

  // Store token lookups
  await redis.set(`wheel:share:${shareToken}`, eventId);
  await redis.set(`wheel:admin:${adminToken}`, eventId);

  // Add children
  const childEntries = {};
  const childIds = [];
  for (const childName of children) {
    const trimmed = childName.trim();
    if (!trimmed) continue;
    const childId = generateChildId();
    childIds.push(childId);
    childEntries[childId] = JSON.stringify({ name: trimmed, hasSpun: false, isReceiver: false });
  }

  if (Object.keys(childEntries).length < 2) {
    return res.status(400).json({ error: 'נדרשים לפחות 2 ילדים' });
  }

  await redis.hset(`wheel:event:${eventId}:children`, childEntries);
  await redis.sadd(`wheel:event:${eventId}:canReceive`, ...childIds);
  await redis.sadd(`wheel:event:${eventId}:canSpin`, ...childIds);

  res.status(201).json({ eventId, adminToken, shareToken });
}

async function getEvent(req, res) {
  const { token, admin } = req.query;

  let eventId;
  let isAdmin = false;

  if (admin) {
    eventId = await redis.get(`wheel:admin:${admin}`);
    isAdmin = true;
  } else if (token) {
    eventId = await redis.get(`wheel:share:${token}`);
  } else {
    return res.status(400).json({ error: 'Missing token' });
  }

  if (!eventId) {
    return res.status(404).json({ error: 'אירוע לא נמצא' });
  }

  const meta = await redis.hgetall(`wheel:event:${eventId}`);
  if (!meta || !meta.name) {
    return res.status(404).json({ error: 'אירוע לא נמצא' });
  }

  const childrenRaw = await redis.hgetall(`wheel:event:${eventId}:children`) || {};
  const canReceive = await redis.smembers(`wheel:event:${eventId}:canReceive`) || [];
  const canSpin = await redis.smembers(`wheel:event:${eventId}:canSpin`) || [];
  const assignmentsRaw = await redis.lrange(`wheel:event:${eventId}:assignments`, 0, -1) || [];

  const children = {};
  for (const [id, val] of Object.entries(childrenRaw)) {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    children[id] = parsed;
  }

  const assignments = assignmentsRaw.map(a => typeof a === 'string' ? JSON.parse(a) : a);

  const result = {
    eventName: meta.name,
    children,
    canReceive,
    canSpin,
    assignments,
  };

  if (isAdmin) {
    result.shareToken = meta.shareToken;
    result.adminToken = admin;
  }

  res.json(result);
}
