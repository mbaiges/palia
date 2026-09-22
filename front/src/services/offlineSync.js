import { defaultApiRepository } from "./repositories/apiRepository";
import { offlineStore as defaultOfflineStore } from "./offlineStore";
import { classifySyncFailure } from "./offlineSyncStatus.js";

const activeSyncs = new Map();

export async function syncPendingFollowUps(userId, { apiRepository = defaultApiRepository, offlineStore = defaultOfflineStore } = {}) {
  if (activeSyncs.has(userId)) return activeSyncs.get(userId);
  const operation = performSync(userId, { apiRepository, offlineStore });
  activeSyncs.set(userId, operation);
  try {
    return await operation;
  } finally {
    activeSyncs.delete(userId);
  }
}

async function performSync(userId, { apiRepository, offlineStore }) {
  if (!userId || !navigator.onLine)
    return {
      synced: 0,
      pending: (await offlineStore.listOutbox(userId)).length,
    };
  const queue = await offlineStore.listOutbox(userId);
  let synced = 0;
  for (const item of queue.sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )) {
    try {
      await apiRepository.patients.createFollowUp(item.patientId, item.payload);
      await offlineStore.removeOutbox(userId, item.id);
      synced += 1;
    } catch (error) {
      const next = {
        ...item,
        attempts: item.attempts + 1,
        lastError: error.message,
        status: classifySyncFailure(error),
      };
      await offlineStore.updateOutbox(next);
      if (
        !navigator.onLine ||
        !error.status ||
        error.status >= 500 ||
        error.status === 401
      )
        break;
    }
  }
  return { synced, pending: (await offlineStore.listOutbox(userId)).length };
}
