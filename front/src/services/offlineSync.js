import { api } from './apiClient';
import { offlineStore } from './offlineStore';

const activeSyncs = new Map();

export async function syncPendingFollowUps(userId) {
  if (activeSyncs.has(userId)) return activeSyncs.get(userId);
  const operation = performSync(userId);
  activeSyncs.set(userId, operation);
  try { return await operation; } finally { activeSyncs.delete(userId); }
}

async function performSync(userId) {
  if (!userId || !navigator.onLine) return { synced: 0, pending: (await offlineStore.listOutbox(userId)).length };
  const queue = await offlineStore.listOutbox(userId);
  let synced = 0;
  for (const item of queue.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    try {
      await api.patients.createFollowUp(item.patientId, item.payload);
      await offlineStore.removeOutbox(item.id);
      synced += 1;
    } catch (error) {
      const next = { ...item, attempts: item.attempts + 1, lastError: error.message, status: error.status === 409 || error.status === 422 || error.status === 404 ? 'needs-review' : 'pending' };
      await offlineStore.updateOutbox(next);
      if (!navigator.onLine || !error.status || error.status >= 500 || error.status === 401) break;
    }
  }
  return { synced, pending: (await offlineStore.listOutbox(userId)).length };
}
