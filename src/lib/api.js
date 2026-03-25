const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('שגיאה בשרת — התשובה אינה תקינה');
  }
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

export function removeAllChildren(adminToken) {
  return request('/children', {
    method: 'PATCH',
    body: JSON.stringify({ adminToken }),
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

export function resetEvent(adminToken) {
  return request('/reset', {
    method: 'POST',
    body: JSON.stringify({ adminToken }),
  });
}

export function updateEvent(adminToken, name) {
  return request('/events', {
    method: 'PATCH',
    body: JSON.stringify({ adminToken, name }),
  });
}

export function deleteEvent(adminToken) {
  return request('/events', {
    method: 'DELETE',
    body: JSON.stringify({ adminToken }),
  });
}
