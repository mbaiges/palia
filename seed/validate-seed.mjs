const ROLES = new Set(['admin', 'coordinator', 'volunteer']);
const CONTACT_TYPES = new Set(['in_person', 'remote']);
const ALERT_STATUSES = new Set(['active', 'resolved']);

const fail = (message) => { throw new Error(`Seed inválido: ${message}`); };

export function validateSeed(seed) {
  if (!seed || typeof seed !== 'object') fail('debe ser un objeto');
  for (const key of ['seedVersion', 'generatedAt', 'users', 'allowedUsers', 'hospitals', 'patients', 'profiles', 'followUps', 'alerts']) {
    if (!(key in seed)) fail(`falta ${key}`);
  }
  const ids = (items, label) => {
    const seen = new Set();
    for (const item of items) {
      if (!item?.id || seen.has(item.id)) fail(`${label} contiene IDs ausentes o duplicados`);
      seen.add(item.id);
    }
    return seen;
  };
  const userIds = ids(seed.users, 'users');
  const hospitalIds = ids(seed.hospitals, 'hospitals');
  const patientIds = ids(seed.patients, 'patients');
  const followUpIds = ids(seed.followUps, 'followUps');
  const alertIds = ids(seed.alerts, 'alerts');
  if (!seed.users.length) fail('debe tener usuarios');
  for (const user of seed.users) if (!ROLES.has(user.role)) fail(`rol inválido: ${user.role}`);
  for (const email of seed.allowedUsers) if (typeof email !== 'string' || !email.includes('@')) fail(`email inválido: ${email}`);
  for (const hospital of seed.hospitals) if (!hospital.name) fail('hospital sin nombre');
  for (const patient of seed.patients) {
    if (!patient.name || !/^\d+$/.test(String(patient.dni))) fail(`paciente inválido: ${patient.id}`);
    if (patient.hospitalId && !hospitalIds.has(patient.hospitalId)) fail(`hospital inexistente en ${patient.id}`);
    if (!patient.caregiver?.name) fail(`cuidador faltante en ${patient.id}`);
    for (const userId of patient.assignedVolunteers ?? []) if (!userIds.has(userId)) fail(`asignación inexistente en ${patient.id}`);
  }
  for (const profile of seed.profiles) if (!userIds.has(profile.userId)) fail(`perfil sin usuario: ${profile.userId}`);
  for (const item of seed.followUps) {
    if (!patientIds.has(item.patientId) || !userIds.has(item.authorId)) fail(`followUp con relación inválida: ${item.id}`);
    if (!CONTACT_TYPES.has(item.contactType)) fail(`contactType inválido: ${item.id}`);
    if (!Number.isInteger(item.durationMinutes) || item.durationMinutes < 15 || item.durationMinutes > 1440 || item.durationMinutes % 15 !== 0) fail(`duración inválida: ${item.id}`);
  }
  for (const alert of seed.alerts) {
    if (!patientIds.has(alert.patientId) || !ALERT_STATUSES.has(alert.status)) fail(`alerta inválida: ${alert.id}`);
    if (alert.followUpId && !followUpIds.has(alert.followUpId)) fail(`followUp inexistente en alerta ${alert.id}`);
    if (!userIds.has(alert.createdBy)) fail(`creador inexistente en alerta ${alert.id}`);
    if (alert.resolvedBy && !userIds.has(alert.resolvedBy)) fail(`resolutor inexistente en alerta ${alert.id}`);
  }
  return true;
}
