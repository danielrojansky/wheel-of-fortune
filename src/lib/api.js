const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'שגיאה בשרת');
  return data;
}

export function createEvent(name, children) {
  return request('/events', {
    method: 'POST',
    body: JSON.stringify({ name, children }),
  });
}

export function getEvent(shareToken) {
  return request(`/events?token=${shareToken}`);
}

export function getAdminEvent(adminToken) {
  return request(`/events?admin=${adminToken}`);
}

export function addChild(adminToken, name) {
  return request('/children', {
    method: 'POST',
    body: JSON.stringify({ adminToken, name }),
  });
}

export function removeChild(adminToken, childId) {
  return request('/children', {
    method: 'DELETE',
    body: JSON.stringify({ adminToken, childId }),
  });
}

export function spin(shareToken, giverId) {
  return request('/spin', {
    method: 'POST',
    body: JSON.stringify({ shareToken, giverId }),
  });
}

export function getPairings(shareToken) {
  return request(`/pairings?token=${shareToken}`);
}
