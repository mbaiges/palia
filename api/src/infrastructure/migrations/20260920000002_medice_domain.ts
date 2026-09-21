import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('hospitals', table => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('address').notNullable();
    table.string('zone').nullable();
    table.string('created_at').notNullable();
    table.string('updated_at').notNullable();
    table.string('archived_at').nullable();
  });
  await knex.schema.createTable('patients', table => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('dni').notNullable().unique();
    table.string('dob').notNullable();
    table.text('address').notNullable();
    table.text('diagnosis').notNullable();
    table.string('hospital_id').nullable();
    table.boolean('complex_situation').notNullable().defaultTo(false);
    table.string('created_by').notNullable().references('id').inTable('users');
    table.string('created_at').notNullable();
    table.string('updated_at').notNullable();
    table.string('archived_at').nullable();
    table.foreign('hospital_id').references('id').inTable('hospitals');
  });
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_patients_archive ON patients(archived_at)'
  );
  await knex.schema.createTable('caregivers', table => {
    table
      .string('patient_id')
      .primary()
      .references('id')
      .inTable('patients')
      .onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('relation').notNullable();
    table.string('phone').notNullable();
    table.boolean('lives_with_patient').notNullable().defaultTo(false);
    table.string('burden_level').notNullable();
    table.string('created_at').notNullable();
    table.string('updated_at').notNullable();
  });
  await knex.schema.createTable('volunteer_profiles', table => {
    table
      .string('user_id')
      .primary()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('phone').nullable();
    table.text('specialty_availability').nullable();
    table.string('tenure').nullable();
    table.text('avatar_url').nullable();
    table.string('status').notNullable().defaultTo('active');
    table.string('created_at').notNullable();
    table.string('updated_at').notNullable();
  });
  await knex.schema.createTable('patient_assignments', table => {
    table
      .string('patient_id')
      .notNullable()
      .references('id')
      .inTable('patients')
      .onDelete('CASCADE');
    table
      .string('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('created_by').notNullable().references('id').inTable('users');
    table.string('created_at').notNullable();
    table.primary(['patient_id', 'user_id']);
  });
  await knex.schema.createTable('follow_ups', table => {
    table.string('id').primary();
    table
      .string('patient_id')
      .notNullable()
      .references('id')
      .inTable('patients');
    table.string('author_id').notNullable().references('id').inTable('users');
    table.string('occurred_at').notNullable();
    table.string('recorded_at').notNullable();
    table.string('contact_type').notNullable();
    table.integer('duration_minutes').notNullable();
    table.text('symptoms').notNullable();
    table.text('symptom_observations').notNullable();
    table.text('social_risk').notNullable();
    table.text('equipment_needs').notNullable();
    table.text('equipment_other').notNullable();
    table.text('interventions').notNullable();
    table.string('client_mutation_id').nullable();
    table.string('client_payload_hash').nullable();
    table.unique(['author_id', 'client_mutation_id']);
    table.index(['patient_id', 'occurred_at']);
  });
  await knex.schema.createTable('alerts', table => {
    table.string('id').primary();
    table
      .string('patient_id')
      .notNullable()
      .references('id')
      .inTable('patients');
    table
      .string('follow_up_id')
      .nullable()
      .references('id')
      .inTable('follow_ups');
    table.string('level').notNullable();
    table.string('motive').notNullable();
    table.text('observations').notNullable();
    table.string('status').notNullable().defaultTo('active');
    table.string('created_by').notNullable().references('id').inTable('users');
    table.string('created_at').notNullable();
    table.string('resolved_by').nullable().references('id').inTable('users');
    table.string('resolved_at').nullable();
    table.text('resolution_note').nullable();
    table.index(['patient_id', 'status']);
  });

  await knex('roles')
    .insert([
      { role_id: 'volunteer', name: 'Volunteer' },
      { role_id: 'coordinator', name: 'Coordinator' },
    ])
    .onConflict('role_id')
    .ignore();
  await knex('permissions')
    .insert([
      {
        permission_id: 'medice:manage_domain',
        description: 'Manage Medice patients, hospitals and assignments',
      },
      {
        permission_id: 'medice:global_stats',
        description: 'Read global Medice statistics',
      },
      {
        permission_id: 'medice:manage_allowlist',
        description: 'Add volunteer emails to the Medice allow-list',
      },
    ])
    .onConflict('permission_id')
    .ignore();
  await knex('role_permissions')
    .insert([
      { role_id: 'volunteer', permission_id: 'example:read' },
      { role_id: 'coordinator', permission_id: 'example:read' },
      { role_id: 'coordinator', permission_id: 'medice:manage_domain' },
      { role_id: 'coordinator', permission_id: 'medice:global_stats' },
      { role_id: 'coordinator', permission_id: 'medice:manage_allowlist' },
      { role_id: 'admin', permission_id: 'medice:manage_domain' },
      { role_id: 'admin', permission_id: 'medice:global_stats' },
      { role_id: 'admin', permission_id: 'medice:manage_allowlist' },
    ])
    .onConflict(['role_id', 'permission_id'])
    .ignore();
  await knex.raw(
    "INSERT OR IGNORE INTO user_roles (user_id, role_id) SELECT user_id, 'volunteer' FROM user_roles WHERE role_id = 'user'"
  );
}

export async function down(knex: Knex): Promise<void> {
  for (const table of [
    'alerts',
    'follow_ups',
    'patient_assignments',
    'volunteer_profiles',
    'caregivers',
    'patients',
    'hospitals',
  ])
    await knex.schema.dropTableIfExists(table);
  await knex('role_permissions')
    .whereIn('permission_id', [
      'medice:manage_domain',
      'medice:global_stats',
      'medice:manage_allowlist',
    ])
    .delete();
  await knex('permissions')
    .whereIn('permission_id', [
      'medice:manage_domain',
      'medice:global_stats',
      'medice:manage_allowlist',
    ])
    .delete();
  await knex('role_permissions')
    .whereIn('role_id', ['volunteer', 'coordinator'])
    .delete();
  await knex('roles').whereIn('role_id', ['volunteer', 'coordinator']).delete();
}
