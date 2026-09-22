import seedFixture from '../../../../seed/medice-seed.json' with { type: 'json' };
import { ApiRepository } from './apiRepository.js';

const DB_VERSION = 1;
const STORE = 'snapshot';
const KEY = 'medice-state';

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const digits = (value) => String(value ?? '').replace(/\D/g, '');
const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();

function openStore(dbName) {
  if (!globalThis.indexedDB) return Promise.reject(new Error('IndexedDB no está disponible en este navegador.'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el backend local.'));
  });
}

async function readSnapshot(dbName) {
  const db = await openStore(dbName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(KEY);
    request.onsuccess = () => { db.close(); resolve(request.result ?? null); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

async function writeSnapshot(dbName, value) {
  const db = await openStore(dbName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, KEY);
    tx.oncomplete = () => { db.close(); resolve(value); };
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error('No se pudo guardar el backend local.')); };
  });
}

function toState(fixture) {
  const users = clone(fixture.users).map((user) => ({ ...user, role: user.role ?? 'volunteer' }));
  return {
    schemaVersion: 1,
    seedVersion: fixture.seedVersion,
    updatedAt: now(),
    activeUserId: 'seed-admin',
    users,
    allowedUsers: clone(fixture.allowedUsers),
    hospitals: clone(fixture.hospitals).map((hospital) => ({ ...hospital, createdAt: hospital.createdAt ?? fixture.generatedAt, updatedAt: hospital.updatedAt ?? fixture.generatedAt })),
    patients: clone(fixture.patients),
    profiles: clone(fixture.profiles),
    followUps: clone(fixture.followUps),
    alerts: clone(fixture.alerts),
  };
}

function decoratePatient(patient, state) {
  const activeAlerts = state.alerts.filter((alert) => alert.patientId === patient.id && alert.status === 'active');
  return {
    ...patient,
    dni: digits(patient.dni),
    currentStatus: activeAlerts.length ? 'Alerta' : patient.complexSituation ? 'En Observación' : 'Estable',
    assignedVolunteers: patient.assignedVolunteers ?? [],
  };
}

function statsFor(state, userId, global) {
  const followUps = global ? state.followUps : state.followUps.filter((item) => item.authorId === userId);
  const activePatients = state.patients.filter((patient) => !patient.archivedAt).length;
  const totalMinutes = followUps.reduce((sum, item) => sum + Number(item.durationMinutes || 0), 0);
  return {
    followUps: followUps.length,
    totalFollowUps: followUps.length,
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    activePatients,
    activeAlerts: state.alerts.filter((alert) => alert.status === 'active').length,
    activeVolunteers: state.users.filter((user) => user.role !== 'admin').length,
  };
}

export class IndexedDBApiRepository extends ApiRepository {
  constructor({ dbName = 'medice-local-backend-v1', seed = seedFixture } = {}) {
    super();
    this.dbName = dbName;
    this.seed = seed;
  }

  async state() {
    return (await readSnapshot(this.dbName)) ?? toState(this.seed);
  }

  async mutate(callback) {
    const state = await this.state();
    const result = await callback(state);
    await writeSnapshot(this.dbName, { ...state, updatedAt: now() });
    return result;
  }

  async ensureSeed() {
    const existing = await readSnapshot(this.dbName);
    if (existing) return existing;
    const state = toState(this.seed);
    await writeSnapshot(this.dbName, state);
    return state;
  }

  async resetSeed() {
    const state = toState(this.seed);
    await writeSnapshot(this.dbName, state);
    return state;
  }

  async activeUser(state) {
    const user = state.users.find((item) => item.id === state.activeUserId) ?? state.users[0];
    return user ?? { id: 'seed-admin', email: 'admin.seed@medice.test', name: 'Admin Demo', role: 'admin' };
  }

  auth = {
    me: async () => {
      const state = await this.ensureSeed();
      const user = await this.activeUser(state);
      return { user, role: 'admin', permissions: ['medice:manage_domain', 'medice:global_stats', 'medice:manage_allowlist'] };
    },
    google: async () => this.auth.me(),
    devBypass: async () => this.auth.me(),
    signOut: async () => undefined,
  };

  bootstrap = async () => {
    const state = await this.ensureSeed();
    const user = await this.activeUser(state);
    const patients = state.patients.map((patient) => decoratePatient(patient, state));
    return {
      userId: user.id,
      userName: user.name,
      role: 'admin',
      patients,
      hospitals: clone(state.hospitals),
      followUps: clone(state.followUps).map((item) => ({ ...item, date: item.date ?? item.occurredAt })),
      alerts: clone(state.alerts),
      volunteers: state.users.map((item) => ({ ...item, activePatients: patients.filter((patient) => patient.assignedVolunteers.includes(item.id) && !patient.archivedAt).length })),
      invitations: state.allowedUsers.map((email) => ({ id: email, email, status: 'Autorizado' })),
      profile: clone(state.profiles.find((profile) => profile.userId === user.id) ?? null),
      stats: { personal: statsFor(state, user.id, false), global: statsFor(state, user.id, true) },
    };
  };

  patients = {
    list: async () => (await this.bootstrap()).patients,
    get: async (id) => (await this.bootstrap()).patients.find((patient) => patient.id === id) ?? null,
    create: async (body) => this.savePatient(body),
    update: async (id, body) => this.savePatient({ ...body, id }),
    archive: async (id) => this.mutate((state) => { const patient = state.patients.find((item) => item.id === id); if (patient) patient.archivedAt = now(); return { success: true }; }),
    restore: async (id) => this.mutate((state) => { const patient = state.patients.find((item) => item.id === id); if (patient) patient.archivedAt = null; return { success: true }; }),
    assign: async (id, volunteerIds) => this.mutate((state) => { const patient = state.patients.find((item) => item.id === id); if (!patient) throw new Error('Paciente no encontrado'); patient.assignedVolunteers = [...new Set(volunteerIds)]; return patient; }),
    followUps: async (id) => (await this.bootstrap()).followUps.filter((item) => item.patientId === id),
    createFollowUp: async (id, body) => this.mutate((state) => {
      const existing = state.followUps.find((item) => item.authorId === state.activeUserId && item.clientMutationId === body.clientMutationId);
      if (existing) return existing;
      const followUp = { ...clone(body), id: body.clientMutationId ?? `local-${Date.now()}`, patientId: id, authorId: state.activeUserId };
      state.followUps.push(followUp);
      return followUp;
    }),
    createAlert: async (id, body) => this.mutate((state) => { const alert = { ...clone(body), id: `local-alert-${Date.now()}`, patientId: id, status: 'active', createdBy: state.activeUserId, createdAt: now() }; state.alerts.push(alert); return alert; }),
  };

  async savePatient(body) {
    return this.mutate((state) => {
      const dni = digits(body.dni);
      const duplicate = state.patients.find((patient) => patient.dni === dni && patient.id !== body.id);
      if (duplicate) throw Object.assign(new Error('El DNI ya está registrado.'), { code: 'CONFLICT', conflict: true });
      const patient = { ...clone(body), id: body.id ?? `local-patient-${Date.now()}`, dni, caregiver: clone(body.caregiver), archivedAt: body.archivedAt ?? null, assignedVolunteers: body.assignedVolunteers ?? [] };
      const index = state.patients.findIndex((item) => item.id === patient.id);
      if (index >= 0) state.patients[index] = { ...state.patients[index], ...patient };
      else state.patients.push(patient);
      return patient;
    });
  }

  alerts = {
    list: async () => (await this.bootstrap()).alerts,
    resolve: async (id, note) => this.mutate((state) => { const alert = state.alerts.find((item) => item.id === id); if (!alert) throw new Error('Alerta activa no encontrada'); alert.status = 'resolved'; alert.resolvedBy = state.activeUserId; alert.resolvedAt = now(); alert.resolutionNote = note ?? ''; return { success: true }; }),
  };

  hospitals = {
    list: async () => (await this.bootstrap()).hospitals,
    create: async (body) => this.mutate((state) => { const hospital = { ...clone(body), id: `local-hospital-${Date.now()}`, archivedAt: null, createdAt: now(), updatedAt: now() }; state.hospitals.push(hospital); return hospital; }),
    update: async (id, body) => this.mutate((state) => { const hospital = state.hospitals.find((item) => item.id === id); if (!hospital) throw new Error('Centro no encontrado'); Object.assign(hospital, clone(body), { updatedAt: now() }); return hospital; }),
    archive: async (id) => this.mutate((state) => { const hospital = state.hospitals.find((item) => item.id === id); if (hospital) hospital.archivedAt = now(); return { success: true }; }),
    restore: async (id) => this.mutate((state) => { const hospital = state.hospitals.find((item) => item.id === id); if (hospital) hospital.archivedAt = null; return { success: true }; }),
  };

  volunteers = {
    list: async () => (await this.bootstrap()).volunteers,
    updateProfile: async (body) => this.mutate((state) => { const index = state.profiles.findIndex((item) => item.userId === state.activeUserId); if (index >= 0) state.profiles[index] = { ...state.profiles[index], ...clone(body) }; else state.profiles.push({ userId: state.activeUserId, ...clone(body) }); return state.profiles[index >= 0 ? index : state.profiles.length - 1]; }),
  };

  access = {
    list: async () => (await this.bootstrap()).invitations,
    addVolunteer: async (email) => this.mutate((state) => { const normalized = normalizeEmail(email); if (!state.allowedUsers.includes(normalized)) state.allowedUsers.push(normalized); return { email: normalized, status: 'Autorizado' }; }),
    remove: async (email) => this.mutate((state) => { state.allowedUsers = state.allowedUsers.filter((item) => item !== normalizeEmail(email)); return { success: true }; }),
  };

  stats = {
    mine: async () => { const state = await this.ensureSeed(); return statsFor(state, state.activeUserId, false); },
    global: async () => { const state = await this.ensureSeed(); return statsFor(state, state.activeUserId, true); },
  };

  push = {
    vapidPublicKey: async () => { throw Object.assign(new Error('Las notificaciones push no están disponibles en el backend local.'), { code: 'UNSUPPORTED' }); },
    subscribe: async () => { throw Object.assign(new Error('Las notificaciones push no están disponibles en el backend local.'), { code: 'UNSUPPORTED' }); },
    unsubscribe: async () => undefined,
  };
}

export const defaultIndexedDBApiRepository = new IndexedDBApiRepository();
