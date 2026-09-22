const DATABASE = "palia-offline-v1";
const VERSION = 2;

function openDatabase(database = DATABASE) {
  if (!("indexedDB" in globalThis))
    return Promise.reject(
      new Error("Este navegador no permite guardar datos offline."),
    );
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(database, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      const transaction = request.transaction;
      if (!db.objectStoreNames.contains("patients"))
        db.createObjectStore("patients", { keyPath: ["userId", "id"] });
      if (!db.objectStoreNames.contains("profiles"))
        db.createObjectStore("profiles", { keyPath: "id" });
      if (!db.objectStoreNames.contains("outbox")) {
        const store = db.createObjectStore("outbox", {
          keyPath: ["userId", "id"],
        });
        store.createIndex("userId", "userId", { unique: false });
      } else {
        const oldOutbox = transaction.objectStore("outbox");
        if (oldOutbox.keyPath === "id") {
          const pending = oldOutbox.getAll();
          pending.onsuccess = () => {
            const previousItems = pending.result;
            db.deleteObjectStore("outbox");
            const store = db.createObjectStore("outbox", {
              keyPath: ["userId", "id"],
            });
            store.createIndex("userId", "userId", { unique: false });
            previousItems.forEach((item) => store.put(item));
          };
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ??
          new Error("No se pudo abrir el almacenamiento offline."),
      );
  });
}

async function transact(database, storeName, mode, run) {
  const db = await openDatabase(database);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let value;
    try {
      value = run(store);
    } catch (error) {
      db.close();
      reject(error);
      return;
    }
    tx.oncomplete = () => {
      db.close();
      resolve(value?.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error ?? new Error("La operación offline fue cancelada."));
    };
  });
}

export function createOfflineStore(database = DATABASE) {
  return {
  saveIdentity(identity) {
    return transact(database, "profiles", "readwrite", (store) =>
      store.put({
        id: identity.id,
        name: identity.displayName,
        role: identity.role,
        savedAt: Date.now(),
      }),
    );
  },
  getIdentity(userId) {
    return transact(database, "profiles", "readonly", (store) => store.get(userId));
  },
  async getLastIdentity() {
    const profiles = await transact(database, "profiles", "readonly", (store) =>
      store.getAll(),
    );
    return profiles.sort((a, b) => b.savedAt - a.savedAt)[0] ?? null;
  },
  cachePatient(userId, patient) {
    return transact(database, "patients", "readwrite", (store) =>
      store.put({ userId, ...patient, cachedAt: Date.now() }),
    );
  },
  getPatient(userId, patientId) {
    return transact(database, "patients", "readonly", (store) =>
      store.get([userId, patientId]),
    );
  },
  removePatient(userId, patientId) {
    return transact(database, "patients", "readwrite", (store) =>
      store.delete([userId, patientId]),
    );
  },
  listPatients(userId) {
    return transact(database, "patients", "readonly", (store) =>
      store.getAll(IDBKeyRange.bound([userId, ""], [userId, "\uffff"])),
    );
  },
  async removePatients(userId) {
    const patients = await this.listPatients(userId);
    await Promise.all(
      patients.map((patient) =>
        transact(database, "patients", "readwrite", (store) =>
          store.delete([userId, patient.id]),
        ),
      ),
    );
  },
  removeIdentity(userId) {
    return transact(database, "profiles", "readwrite", (store) => store.delete(userId));
  },
  enqueue(userId, patientId, payload) {
    return transact(database, "outbox", "readwrite", (store) =>
      store.put({
        id: payload.clientMutationId,
        userId,
        patientId,
        payload,
        status: "pending",
        attempts: 0,
        createdAt: new Date().toISOString(),
        lastError: null,
      }),
    );
  },
  listOutbox(userId) {
    return transact(database, "outbox", "readonly", (store) =>
      store.index("userId").getAll(userId),
    );
  },
  updateOutbox(item) {
    return transact(database, "outbox", "readwrite", (store) => store.put(item));
  },
  removeOutbox(userId, id) {
    return transact(database, "outbox", "readwrite", (store) =>
      store.delete([userId, id]),
    );
  },
  async clearOutbox(userId) {
    const pending = await this.listOutbox(userId);
    await Promise.all(pending.map((item) => this.removeOutbox(userId, item.id)));
    return pending.length;
  },
  };
}

export const offlineStore = createOfflineStore();
