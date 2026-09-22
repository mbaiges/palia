import fs from 'node:fs';
import path from 'node:path';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { isSeedResetAllowed } from '@/infrastructure/seed/seedPolicy';
// Shared fixture validator is authored as ESM so Vite and Node can consume it.
// @ts-expect-error The seed directory intentionally has no API-specific build types.
import { validateSeed } from '../../seed/validate-seed.mjs';

type Seed = any;

function readSeed(): Seed {
  const seedPath = path.resolve(process.cwd(), '..', 'seed', 'medice-seed.json');
  return JSON.parse(fs.readFileSync(seedPath, 'utf8'));
}

async function run(): Promise<void> {
  const reset = process.argv.includes('--reset');
  if (reset && !isSeedResetAllowed()) throw new Error('El reset del seed solo está permitido en development/test/e2e con USE_LOCAL_DB=true.');
  await DatabaseConfig.initializeTables();
  const db = DatabaseConfig.getKnex();
  const seed = readSeed();
  validateSeed(seed);
  const timestamp = seed.generatedAt ?? new Date().toISOString();

  await db.transaction(async trx => {
    if (reset) {
      const userIds = seed.users.map((user: any) => user.id);
      const patientIds = seed.patients.map((patient: any) => patient.id);
      const hospitalIds = seed.hospitals.map((hospital: any) => hospital.id);
      await trx('alerts').whereIn('patient_id', patientIds).delete();
      await trx('follow_ups').whereIn('patient_id', patientIds).delete();
      await trx('patient_assignments').whereIn('patient_id', patientIds).delete();
      await trx('caregivers').whereIn('patient_id', patientIds).delete();
      await trx('patients').whereIn('id', patientIds).delete();
      await trx('volunteer_profiles').whereIn('user_id', userIds).delete();
      await trx('hospitals').whereIn('id', hospitalIds).delete();
      await trx('user_roles').whereIn('user_id', userIds).delete();
      await trx('users').whereIn('id', userIds).delete();
      await trx('app_settings_allowed_users').whereIn('email', seed.allowedUsers).delete();
    }

    await trx('roles').insert(seed.users.map((user: any) => ({ role_id: user.role, name: user.role }))).onConflict('role_id').ignore();
    await trx('app_settings_allowed_users').insert(seed.allowedUsers.map((email: string) => ({ email: email.toLowerCase(), created_at: timestamp }))).onConflict('email').ignore();
    await trx('users').insert(seed.users.map((user: any) => ({ id: user.id, google_id: `seed-${user.id}`, email: user.email.toLowerCase(), name: user.name, profile_image_id: null, avatar_image_id: null, created_at: timestamp, updated_at: timestamp }))).onConflict('id').merge(['email', 'name', 'updated_at']);
    for (const user of seed.users) await trx('user_roles').insert({ user_id: user.id, role_id: user.role }).onConflict(['user_id', 'role_id']).ignore();
    await trx('hospitals').insert(seed.hospitals.map((hospital: any) => ({ id: hospital.id, name: hospital.name, address: hospital.address, zone: hospital.zone || null, created_at: timestamp, updated_at: timestamp, archived_at: hospital.archivedAt || null }))).onConflict('id').merge();
    await trx('patients').insert(seed.patients.map((patient: any) => ({ id: patient.id, name: patient.name, dni: String(patient.dni).replace(/\D/g, ''), dob: patient.dob, address: patient.address, diagnosis: patient.diagnosis, hospital_id: patient.hospitalId || null, complex_situation: Boolean(patient.complexSituation), created_by: patient.createdBy || seed.users[0].id, created_at: timestamp, updated_at: timestamp, archived_at: patient.archivedAt || null }))).onConflict('id').merge();
    await trx('caregivers').insert(seed.patients.map((patient: any) => ({ patient_id: patient.id, name: patient.caregiver.name, relation: patient.caregiver.relation, phone: patient.caregiver.phone, lives_with_patient: Boolean(patient.caregiver.livesWithPatient), burden_level: patient.caregiver.burdenLevel || 'Bajo', created_at: timestamp, updated_at: timestamp }))).onConflict('patient_id').merge();
    await trx('volunteer_profiles').insert(seed.profiles.map((profile: any) => ({ user_id: profile.userId, phone: profile.phone, specialty_availability: profile.specialtyAvailability, tenure: profile.tenure, avatar_url: profile.avatarUrl || null, status: profile.status || 'active', created_at: timestamp, updated_at: timestamp }))).onConflict('user_id').merge();
    await trx('patient_assignments').insert(seed.patients.flatMap((patient: any) => (patient.assignedVolunteers || []).map((userId: string) => ({ patient_id: patient.id, user_id: userId, created_by: seed.users[0].id, created_at: timestamp })))).onConflict(['patient_id', 'user_id']).ignore();
    await trx('follow_ups').insert(seed.followUps.map((item: any) => ({ id: item.id, patient_id: item.patientId, author_id: item.authorId, occurred_at: item.occurredAt, recorded_at: item.occurredAt, contact_type: item.contactType, duration_minutes: item.durationMinutes, symptoms: JSON.stringify(item.symptoms || {}), symptom_observations: item.symptomObservations || '', social_risk: JSON.stringify(item.socialRisk || {}), equipment_needs: JSON.stringify(item.equipmentNeeds || []), equipment_other: item.equipmentOther || '', interventions: item.interventions || '', client_mutation_id: item.clientMutationId || null }))).onConflict('id').merge();
    await trx('alerts').insert(seed.alerts.map((item: any) => ({ id: item.id, patient_id: item.patientId, follow_up_id: item.followUpId || null, level: item.level, motive: item.motive, observations: item.observations, status: item.status, created_by: item.createdBy, created_at: item.createdAt, resolved_by: item.resolvedBy || null, resolved_at: item.resolvedAt || null, resolution_note: item.resolutionNote || null }))).onConflict('id').merge();
  });

  console.log(`Medice seed ${seed.seedVersion} aplicado (${reset ? 'reset + upsert' : 'upsert'}).`);
  await DatabaseConfig.close();
}

run().catch(async error => { console.error(error); await DatabaseConfig.close(); process.exitCode = 1; });
