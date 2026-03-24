const STORAGE_KEY = 'wheel:adminTokens';

export function getSavedEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveEvent(adminToken, eventName) {
  const events = getSavedEvents();
  const existing = events.find((e) => e.adminToken === adminToken);
  if (existing) {
    existing.eventName = eventName;
    existing.updatedAt = Date.now();
  } else {
    events.push({ adminToken, eventName, createdAt: Date.now(), updatedAt: Date.now() });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function removeEvent(adminToken) {
  const events = getSavedEvents().filter((e) => e.adminToken !== adminToken);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function updateEventName(adminToken, eventName) {
  saveEvent(adminToken, eventName);
}
