import { createDbService } from './db';
import { defaultApiRepository } from './repositories/apiRepository';
import { IndexedDBApiRepository } from './repositories/indexedDbApiRepository';
import { createOfflineStore } from './offlineStore';

const localEnabled = import.meta.env.VITE_LOCAL_BACKEND_ENABLED === 'true'
  && import.meta.env.MODE !== 'production';
const defaultProvider = import.meta.env.VITE_DEFAULT_BACKEND === 'local' && localEnabled ? 'local' : 'http';
const BACKEND_PREFERENCE_KEY = 'medice.backend-provider';
const storedProvider = (() => {
  try { return window.localStorage.getItem(BACKEND_PREFERENCE_KEY); } catch { return null; }
})();
const initialProvider = storedProvider === 'local' && localEnabled ? 'local' : storedProvider === 'http' ? 'http' : defaultProvider;
const localRepository = new IndexedDBApiRepository();
let activeProvider = initialProvider;
let activeRepository = activeProvider === 'local' ? localRepository : defaultApiRepository;
const offlineDatabaseName = (provider) => provider === 'http' ? 'palia-offline-v1' : 'palia-offline-local-v1';
let activeOfflineStore = createOfflineStore(offlineDatabaseName(activeProvider));
let activeDbService = createDbService({ apiRepository: activeRepository, offlineStore: activeOfflineStore, backendProvider: activeProvider });

function proxyFor(getter) {
  return new Proxy({}, {
    get(_target, property) {
      const value = getter()[property];
      return typeof value === 'function' ? value.bind(getter()) : value;
    },
  });
}

// Composition root: pages only see these stable facades. The concrete adapter
// can change without rebuilding the application services or importing adapters.
export const apiRepository = proxyFor(() => activeRepository);
export const dbService = proxyFor(() => activeDbService);
export const offlineStore = proxyFor(() => activeOfflineStore);

async function pendingOutboxCount() {
  const userId = activeDbService.getCurrentUserId?.();
  if (!userId) return 0;
  const items = await activeOfflineStore.listOutbox(userId);
  return items.filter((item) => item.status !== 'synced').length;
}

export async function getPendingOutboxCount() {
  return pendingOutboxCount();
}

export async function discardActiveOutbox() {
  const userId = activeDbService.getCurrentUserId?.();
  if (!userId) return 0;
  const removed = await activeOfflineStore.clearOutbox(userId);
  window.dispatchEvent(new CustomEvent('medice:data-updated'));
  return removed;
}

export function getBackendInfo() {
  return {
    provider: activeProvider,
    enabled: localEnabled,
    label: activeProvider === 'local' ? 'Local (IndexedDB)' : 'API',
  };
}

export async function switchBackend(provider) {
  if (provider !== 'http' && provider !== 'local') throw new Error('Backend inválido.');
  if (provider === 'local' && !localEnabled) throw new Error('El backend local no está habilitado en este entorno.');
  if (provider === activeProvider) return getBackendInfo();
  let pending = await pendingOutboxCount();
  if (pending > 0 && navigator.onLine) {
    try { await activeDbService.syncOffline(); } catch { /* leave pending items for explicit discard */ }
    pending = await pendingOutboxCount();
  }
  if (pending > 0) {
    const error = new Error(`Hay ${pending} cambios offline pendientes. Sincronizalos o descartalos antes de cambiar de backend.`);
    error.code = 'PENDING_OUTBOX';
    error.pending = pending;
    throw error;
  }
  activeProvider = provider;
  try { window.localStorage.setItem(BACKEND_PREFERENCE_KEY, provider); } catch { /* storage can be unavailable in private mode */ }
  activeRepository = provider === 'local' ? localRepository : defaultApiRepository;
  activeOfflineStore = createOfflineStore(offlineDatabaseName(activeProvider));
  activeDbService = createDbService({ apiRepository: activeRepository, offlineStore: activeOfflineStore, backendProvider: activeProvider });
  window.dispatchEvent(new CustomEvent('medice:backend-changed', { detail: getBackendInfo() }));
  return getBackendInfo();
}

export async function resetActiveLocalSeed() {
  if (activeProvider !== 'local') throw new Error('El seed local solo está disponible en modo Local.');
  await localRepository.resetSeed();
  await activeDbService.initialize();
  window.dispatchEvent(new CustomEvent('medice:data-updated'));
  return getBackendInfo();
}
