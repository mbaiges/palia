import { api } from './apiClient';
import { offlineStore } from './offlineStore';
import { syncPendingFollowUps } from './offlineSync';

const emptyState = () => ({ patients: [], hospitals: [], followUps: [], alerts: [], volunteers: [], invitations: [], profile: null, stats: {} });
let state = emptyState();
let initialized = false;

function notify() {
  window.dispatchEvent(new CustomEvent('medice:data-updated'));
}

async function refresh() {
  const response = await api.bootstrap();
  state = response.data ?? emptyState();
  if (state.userId) {
    const cachedPatients = await offlineStore.listPatients(state.userId);
    const stillAssigned = new Set(state.patients.filter((patient) => !patient.archivedAt && patient.assignedVolunteers?.includes(state.userId)).map((patient) => patient.id));
    await Promise.all(cachedPatients.filter((patient) => !stillAssigned.has(patient.id)).map((patient) => offlineStore.removePatient(state.userId, patient.id)));
  }
  initialized = true;
  notify();
  return state;
}

function canonicalSymptoms(input = {}) {
  return {
    pain: input.pain ?? input.dolor ?? '',
    nausea: input.nausea ?? input.nauseas ?? '',
    dyspnea: input.dyspnea ?? input.disnea ?? '',
  };
}

export const dbService = {
  initialize: refresh,
  async initializeOffline(identity) {
    const [patients, queued] = await Promise.all([offlineStore.listPatients(identity.id), offlineStore.listOutbox(identity.id)]);
    state = { ...emptyState(), userId: identity.id, userName: identity.name, role: identity.role, patients, followUps: queued.map((item) => ({ ...item.payload, id: item.id, patientId: item.patientId, authorId: identity.id, authorName: identity.name, occurredAt: item.payload.occurredAt ?? item.createdAt, date: item.payload.occurredAt ?? item.createdAt, contactType: item.payload.contactType === 'remote' ? 'Remoto' : 'Presencial', status: item.status === 'needs-review' ? 'needs-review' : 'pending-sync' })) };
    initialized = true;
    notify();
    return state;
  },
  async saveOfflineIdentity(identity) { state.userName = identity.displayName ?? identity.name; await offlineStore.saveIdentity(identity); },
  getOfflineIdentity: (userId) => offlineStore.getIdentity(userId),
  async cachePatientOffline(patientId) {
    if (!state.userId || !navigator.onLine) return false;
    const patient = state.patients.find((item) => item.id === patientId);
    if (patient?.archivedAt || !patient?.assignedVolunteers?.includes(state.userId)) return false;
    await offlineStore.cachePatient(state.userId, patient);
    return true;
  },
  async syncOffline() {
    if (!state.userId || !navigator.onLine) return { synced: 0, pending: 0 };
    const result = await syncPendingFollowUps(state.userId);
    if (result.synced) await refresh();
    notify();
    return result;
  },
  getOfflineQueue: (userId = state.userId) => offlineStore.listOutbox(userId),
  isInitialized: () => initialized,
  subscribe(listener) {
    window.addEventListener('medice:data-updated', listener);
    return () => window.removeEventListener('medice:data-updated', listener);
  },
  async clear() {
    const userId = state.userId;
    if (userId) await Promise.all([offlineStore.removePatients(userId), offlineStore.removeIdentity(userId)]);
    state = emptyState(); initialized = false; notify();
  },
  getPatients: () => state.patients,
  getRole: () => state.role,
  getCurrentUserId: () => state.userId,
  getStats: () => state.stats,
  getProfile: () => state.profile,
  getPatient: (id) => state.patients.find((patient) => patient.id === id) ?? null,
  async savePatient(patientData, caregiverData) {
    const body = { ...patientData, caregiver: caregiverData };
    const result = patientData.id ? await api.patients.update(patientData.id, body) : await api.patients.create(body);
    await refresh();
    return result.data?.id;
  },
  async archivePatient(id) { await api.patients.archive(id); await refresh(); },
  async restorePatient(id) { await api.patients.restore(id); await refresh(); },
  updatePatientStatus() { /* Patient status is derived from active alerts and complexity by the API. */ },
  getCaregiverForPatient: (patientId) => state.patients.find((patient) => patient.id === patientId)?.caregiver ?? null,
  getFollowUpsForPatient: (patientId) => state.followUps.filter((followUp) => followUp.patientId === patientId).sort((a, b) => new Date(b.occurredAt ?? b.date) - new Date(a.occurredAt ?? a.date)),
  async saveFollowUp(eventData) {
    const remote = eventData.contactType === 'Remoto' || eventData.contactType === 'remote';
    const payload = {
      occurredAt: eventData.occurredAt ?? eventData.date ?? new Date().toISOString(),
      contactType: remote ? 'remote' : 'in_person',
      durationMinutes: eventData.durationMinutes ?? (remote ? 60 : 120),
      symptoms: canonicalSymptoms(eventData.symptoms),
      symptomObservations: eventData.symptomObservations ?? eventData.symptomObs ?? '',
      socialRisk: eventData.socialRisk ?? {},
      equipmentNeeds: eventData.equipmentNeeds ?? eventData.equipment ?? [],
      equipmentOther: eventData.equipmentOther ?? eventData.equipOther ?? '',
      interventions: eventData.interventions ?? '',
      clientMutationId: eventData.clientMutationId,
      alert: eventData.alert ?? null,
    };
    try {
      const result = await api.patients.createFollowUp(eventData.patientId, payload);
      await refresh();
      return result.data;
    } catch (error) {
      const patient = state.patients.find((item) => item.id === eventData.patientId);
      if (!(error instanceof TypeError) && navigator.onLine) throw error;
      if (!state.userId || patient?.archivedAt || !patient?.assignedVolunteers?.includes(state.userId) || !(await offlineStore.getPatient(state.userId, eventData.patientId))) {
        throw new Error('Para guardar sin conexión, primero abrí la ficha de un paciente que tengas asignado.');
      }
      await offlineStore.enqueue(state.userId, eventData.patientId, payload);
      state.followUps = [{ ...payload, id: payload.clientMutationId, patientId: eventData.patientId, authorId: state.userId, authorName: state.userName ?? '', contactType: remote ? 'Remoto' : 'Presencial', date: payload.occurredAt, status: 'pending-sync' }, ...state.followUps];
      notify();
      return { id: payload.clientMutationId, patientId: eventData.patientId, pendingSync: true };
    }
  },
  getVolunteers: () => state.volunteers,
  async saveVolunteer(volunteer) {
    const result = await api.volunteers.updateProfile({
      phone: volunteer.phone,
      specialtyAvailability: volunteer.specialtyAvailability ?? volunteer.specialty,
      tenure: volunteer.tenure,
      avatarUrl: volunteer.avatarUrl ?? volunteer.avatar,
    });
    await refresh();
    return result.data;
  },
  async assignVolunteersToPatient(patientId, volunteerIds) { await api.patients.assign(patientId, volunteerIds); await refresh(); },
  async assignVolunteerToPatient(patientId, volunteerId) {
    const patient = this.getPatient(patientId);
    const assigned = patient?.assignedVolunteers ?? [];
    await this.assignVolunteersToPatient(patientId, assigned.includes(volunteerId) ? assigned.filter((id) => id !== volunteerId) : [...assigned, volunteerId]);
  },
  getHospitals: () => state.hospitals,
  async saveHospital(hospital) {
    const result = hospital.id ? await api.hospitals.update(hospital.id, hospital) : await api.hospitals.create(hospital);
    await refresh();
    return result.data;
  },
  async deleteHospital(id) { await api.hospitals.archive(id); await refresh(); },
  async restoreHospital(id) { await api.hospitals.restore(id); await refresh(); },
  getAllFollowUps: () => state.followUps,
  isCloudBackend: () => true,
  getAlerts: () => state.alerts,
  async resolveAlert(id, note) { await api.alerts.resolve(id, note); await refresh(); },
  async createAlert(patientId, alert) { await api.patients.createAlert(patientId, alert); await refresh(); },
  getInvitations: () => state.invitations,
  async saveInvitation(invite) {
    const result = await api.access.addVolunteer(invite.email);
    await refresh();
    return result.data;
  },
  revokeInvitation(email) { return this.deleteInvitation(email); },
  async deleteInvitation(email) { await api.access.remove(email); await refresh(); },
};
