const DATABASE = 'palia-offline-v1';
const VERSION = 1;

function openDatabase() {
  if (!('indexedDB' in globalThis)) return Promise.reject(new Error('Este navegador no permite guardar datos offline.'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('patients')) db.createObjectStore('patients', { keyPath: ['userId', 'id'] });
      if (!db.objectStoreNames.contains('profiles')) db.createObjectStore('profiles', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('outbox')) {
        const store = db.createObjectStore('outbox', { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacenamiento offline.'));
  });
}

async function transact(storeName, mode, run) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let value;
    try { value = run(store); } catch (error) { db.close(); reject(error); return; }
    tx.oncomplete = () => { db.close(); resolve(value?.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error('La operación offline fue cancelada.')); };
  });
}

export const offlineStore = {
  saveIdentity(identity) {
    return transact('profiles', 'readwrite', (store) => store.put({ id: identity.id, name: identity.displayName, role: identity.role, savedAt: Date.now() }));
  },
  getIdentity(userId) {
    return transact('profiles', 'readonly', (store) => store.get(userId));
  },
  async getLastIdentity() {
    const profiles = await transact('profiles', 'readonly', (store) => store.getAll());
    return profiles.sort((a, b) => b.savedAt - a.savedAt)[0] ?? null;
  },
  cachePatient(userId, patient) {
    return transact('patients', 'readwrite', (store) => store.put({ userId, ...patient, cachedAt: Date.now() }));
  },
  getPatient(userId, patientId) {
    return transact('patients', 'readonly', (store) => store.get([userId, patientId]));
  },
  removePatient(userId, patientId) {
    return transact('patients', 'readwrite', (store) => store.delete([userId, patientId]));
  },
  listPatients(userId) {
    return transact('patients', 'readonly', (store) => store.getAll(IDBKeyRange.bound([userId, ''], [userId, '\uffff'])));
  },
  async removePatients(userId) {
    const patients = await this.listPatients(userId);
    await Promise.all(patients.map((patient) => transact('patients', 'readwrite', (store) => store.delete([userId, patient.id]))));
  },
  removeIdentity(userId) {
    return transact('profiles', 'readwrite', (store) => store.delete(userId));
  },
  enqueue(userId, patientId, payload) {
    return transact('outbox', 'readwrite', (store) => store.put({ id: payload.clientMutationId, userId, patientId, payload, status: 'pending', attempts: 0, createdAt: new Date().toISOString(), lastError: null }));
  },
  listOutbox(userId) {
    return transact('outbox', 'readonly', (store) => store.index('userId').getAll(userId));
  },
  updateOutbox(item) {
    return transact('outbox', 'readwrite', (store) => store.put(item));
  },
  removeOutbox(id) {
    return transact('outbox', 'readwrite', (store) => store.delete(id));
  },
};
