import { createHash, randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import type { Knex } from 'knex';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { container } from '@/infrastructure/config/container';
import type { AuthenticatedRequest } from '@/infrastructure/middleware/authMiddleware';
import { GenericNotificationService } from '@/infrastructure/services/GenericNotificationService';

const now = () => new Date().toISOString();
const digits = (value: unknown) => String(value ?? '').replace(/\D/g, '');
const normalizeText = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const parseJson = (value: unknown, fallback: unknown = null) => {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export class MediceController {
  private get db(): Knex {
    return DatabaseConfig.getKnex();
  }
  private userId(req: Request): string {
    return (req as AuthenticatedRequest).user!.id;
  }

  private async notifyAssignedTeam(
    patientId: string,
    alertId: string,
    actorId: string
  ): Promise<void> {
    const assignments = await this.db('patient_assignments as pa')
      .join('volunteer_profiles as vp', 'vp.user_id', 'pa.user_id')
      .where({ 'pa.patient_id': patientId, 'vp.status': 'active' })
      .select('pa.user_id');
    const recipients = [
      ...new Set(
        assignments
          .map((assignment: any) => String(assignment.user_id))
          .filter((userId: string) => userId !== actorId)
      ),
    ];
    const notifications = container.resolve(GenericNotificationService);
    await Promise.all(
      recipients.map(userId =>
        notifications.sendGenericClinicalAlert(userId, alertId)
      )
    );
  }

  private async patientDto(row: any): Promise<any> {
    const [caregiver, hospital, assignments, alerts] = await Promise.all([
      this.db('caregivers').where({ patient_id: row.id }).first(),
      row.hospital_id
        ? this.db('hospitals').where({ id: row.hospital_id }).first()
        : null,
      this.db('patient_assignments')
        .where({ patient_id: row.id })
        .select('user_id'),
      this.db('alerts')
        .where({ patient_id: row.id, status: 'active' })
        .select('id'),
    ]);
    return {
      id: row.id,
      name: row.name,
      dni: row.dni,
      dob: row.dob,
      address: row.address,
      diagnosis: row.diagnosis,
      hospitalId: row.hospital_id,
      hospitalName: hospital?.name ?? null,
      complexSituation: Boolean(row.complex_situation),
      currentStatus: alerts.length
        ? 'Alerta'
        : row.complex_situation
          ? 'En Observación'
          : 'Estable',
      assignedVolunteers: assignments.map((item: any) => item.user_id),
      archivedAt: row.archived_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      caregiver: caregiver
        ? {
            patientId: row.id,
            name: caregiver.name,
            relation: caregiver.relation,
            phone: caregiver.phone,
            livesWithPatient: Boolean(caregiver.lives_with_patient),
            burdenLevel: caregiver.burden_level,
          }
        : null,
      activeAlerts: alerts.length,
    };
  }

  async bootstrap(req: Request, res: Response): Promise<void> {
    const userId = this.userId(req);
    const roles = await this.db('user_roles')
      .where({ user_id: userId })
      .select('role_id');
    const isAdmin = roles.some(row => row.role_id === 'admin');
    const isCoordinator = roles.some(row => row.role_id === 'coordinator');
    const [
      patientRows,
      hospitals,
      followUpRows,
      alertRows,
      volunteerRows,
      allowedRows,
    ] = await Promise.all([
      this.db('patients').orderBy('name'),
      this.db('hospitals').orderBy('name'),
      this.db('follow_ups as f')
        .join('users as u', 'u.id', 'f.author_id')
        .select('f.*', 'u.name as author_name')
        .orderBy('f.occurred_at', 'desc'),
      this.db('alerts as a')
        .join('patients as p', 'p.id', 'a.patient_id')
        .join('users as u', 'u.id', 'a.created_by')
        .leftJoin('users as resolver', 'resolver.id', 'a.resolved_by')
        .select(
          'a.*',
          'p.name as patient_name',
          'u.name as author_name',
          'resolver.name as resolved_by_name'
        )
        .orderBy('a.created_at', 'desc'),
      this.db('volunteer_profiles as vp')
        .join('users as u', 'u.id', 'vp.user_id')
        .where('vp.status', 'active')
        .select('vp.*', 'u.name', 'u.email', 'u.profile_image_id'),
      isAdmin || isCoordinator
        ? this.db('app_settings_allowed_users')
            .select('email', 'created_at')
            .orderBy('email')
        : Promise.resolve([]),
    ]);
    const patients = await Promise.all(
      patientRows.map((row: any) => this.patientDto(row))
    );
    const followUps = followUpRows.map((row: any) => {
      const linkedAlert = alertRows.find(
        (alert: any) => alert.follow_up_id === row.id
      );
      return {
        id: row.id,
        patientId: row.patient_id,
        authorId: row.author_id,
        authorName: row.author_name,
        occurredAt: row.occurred_at,
        recordedAt: row.recorded_at,
        date: row.occurred_at,
        contactType: row.contact_type === 'in_person' ? 'Presencial' : 'Remoto',
        durationMinutes: row.duration_minutes,
        durationHours: row.duration_minutes / 60,
        symptoms: parseJson(row.symptoms, {}),
        symptomObservations: row.symptom_observations,
        socialRisk: parseJson(row.social_risk, {}),
        equipmentNeeds: parseJson(row.equipment_needs, []),
        equipmentOther: row.equipment_other,
        interventions: row.interventions,
        alertActivated: Boolean(linkedAlert),
        alert: linkedAlert
          ? {
              id: linkedAlert.id,
              level: linkedAlert.level,
              motive: linkedAlert.motive,
              observations: linkedAlert.observations,
              status: linkedAlert.status,
              createdAt: linkedAlert.created_at,
              resolvedAt: linkedAlert.resolved_at,
              resolutionNote: linkedAlert.resolution_note,
            }
          : null,
      };
    });
    const volunteers = await Promise.all(
      volunteerRows.map(async (row: any) => ({
        id: row.user_id,
        userId: row.user_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        specialty: row.specialty_availability,
        tenure: row.tenure,
        avatar: row.avatar_url ?? row.profile_image_id,
        status: row.status === 'active' ? 'Activo' : 'Inactivo',
        activePatients: Number(
          (
            await this.db('patient_assignments')
              .where({ user_id: row.user_id })
              .count({ count: '*' })
              .first()
          )?.count ?? 0
        ),
      }))
    );
    const alerts = alertRows.map((row: any) => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      followUpId: row.follow_up_id,
      level: row.level,
      motive: row.motive,
      observations: row.observations,
      status: row.status,
      authorId: row.created_by,
      authorName: row.author_name,
      createdAt: row.created_at,
      resolvedBy: row.resolved_by,
      resolvedByName: row.resolved_by_name,
      resolvedAt: row.resolved_at,
      resolutionNote: row.resolution_note,
    }));
    const visitQuery = this.db('follow_ups').where('author_id', userId);
    const [personalCount, totalCount, alertCount] = await Promise.all([
      visitQuery.clone().count({ count: '*' }).first(),
      this.db('follow_ups').count({ count: '*' }).first(),
      this.db('alerts')
        .where({ status: 'active' })
        .count({ count: '*' })
        .first(),
    ]);
    const personalStats = {
      visits: Number(personalCount?.count ?? 0),
      durationHours:
        Number(
          (await visitQuery.clone().sum({ total: 'duration_minutes' }).first())
            ?.total ?? 0
        ) / 60,
      patientsAttended: Number(
        (
          await visitQuery
            .clone()
            .countDistinct({ count: 'patient_id' })
            .first()
        )?.count ?? 0
      ),
    };
    const activePatientCount = Number(
      (
        await this.db('patients')
          .whereNull('archived_at')
          .count({ count: '*' })
          .first()
      )?.count ?? 0
    );
    const globalStats = {
      visits: Number(totalCount?.count ?? 0),
      activeAlerts: Number(alertCount?.count ?? 0),
      activePatients: activePatientCount,
      activeVolunteers: volunteerRows.length,
      durationHours:
        Number(
          (
            await this.db('follow_ups')
              .sum({ total: 'duration_minutes' })
              .first()
          )?.total ?? 0
        ) / 60,
    };
    const profileRow = await this.db('volunteer_profiles')
      .where({ user_id: userId })
      .first();
    const initialAdminEmails = new Set(
      (process.env.INITIAL_ADMIN_EMAILS ?? '')
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean)
    );
    const invitations = await Promise.all(
      allowedRows.map(async (row: any) => {
        const user = await this.db('users')
          .whereRaw('LOWER(email) = ?', [String(row.email).toLowerCase()])
          .first('id', 'name');
        const userRoles = user
          ? await this.db('user_roles')
              .where({ user_id: user.id })
              .select('role_id')
          : [];
        const roles = userRoles.map((item: any) => item.role_id as string);
        const role =
          roles.includes('admin') ||
          initialAdminEmails.has(String(row.email).trim().toLowerCase())
            ? 'Administrador'
            : roles.includes('coordinator')
              ? 'Coordinador'
              : 'Voluntario';
        return {
          id: row.email,
          email: row.email,
          name: user?.name ?? '',
          date: row.created_at,
          status: 'Autorizado',
          role,
        };
      })
    );
    res.json({
      data: {
        userId,
        role: isAdmin ? 'admin' : isCoordinator ? 'coordinator' : 'volunteer',
        patients,
        hospitals,
        followUps,
        alerts,
        volunteers,
        invitations,
        profile: profileRow
          ? {
              userId,
              phone: profileRow.phone,
              specialtyAvailability: profileRow.specialty_availability,
              tenure: profileRow.tenure,
              avatarUrl: profileRow.avatar_url,
              status: profileRow.status,
            }
          : null,
        stats:
          isAdmin || isCoordinator
            ? { personal: personalStats, global: globalStats }
            : { personal: personalStats },
      },
    });
  }

  async listPatients(req: Request, res: Response): Promise<void> {
    const includeArchived = req.query.includeArchived === 'true';
    let rows: any[] = await this.db('patients')
      .modify(query => {
        if (!includeArchived) query.whereNull('archived_at');
      })
      .orderBy('name')
      .orderBy('id');
    const q = normalizeText(req.query.q);
    if (q)
      rows = rows.filter(
        row =>
          [row.name, row.dni, row.diagnosis].some(value =>
            normalizeText(value).includes(q)
          ) ||
          (digits(q).length > 0 && digits(row.dni).includes(digits(q)))
      );
    const status = String(req.query.status ?? 'all');
    const dtos = await Promise.all(
      rows.map((row: any) => this.patientDto(row))
    );
    const filtered =
      status === 'all'
        ? dtos
        : dtos.filter(patient =>
            status === 'critical'
              ? patient.currentStatus === 'Alerta'
              : status === 'observation'
                ? patient.currentStatus === 'En Observación'
                : patient.currentStatus === 'Estable'
          );
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
    const offset = Math.max(0, Number(req.query.cursor ?? 0));
    res.json({
      data: filtered.slice(offset, offset + limit),
      page: {
        limit,
        nextCursor:
          offset + limit < filtered.length ? String(offset + limit) : null,
        total: filtered.length,
      },
    });
  }

  async getPatient(req: Request, res: Response): Promise<void> {
    const row = await this.db('patients')
      .where({ id: req.params.patientId })
      .first();
    if (!row) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }
    const dto = await this.patientDto(row);
    res.json({ data: dto });
  }

  async savePatient(req: Request, res: Response): Promise<void> {
    const body = req.body ?? {};
    const dni = digits(body.dni);
    if (
      !body.name?.trim() ||
      dni.length < 6 ||
      !body.dob ||
      !body.address?.trim() ||
      !body.diagnosis?.trim() ||
      !body.caregiver?.name?.trim() ||
      !body.caregiver?.phone?.trim() ||
      !body.caregiver?.relation?.trim()
    ) {
      res.status(422).json({
        error: 'Complete los datos requeridos del paciente y cuidador.',
      });
      return;
    }
    const id = req.params.patientId ?? randomUUID();
    const timestamp = now();
    try {
      await this.db.transaction(async trx => {
        const existing = req.params.patientId
          ? await trx('patients').where({ id }).first()
          : null;
        if (req.params.patientId && !existing)
          throw Object.assign(new Error('Paciente no encontrado'), {
            status: 404,
          });
        if (body.hospitalId) {
          const hospitalQuery = trx('hospitals').where({ id: body.hospitalId });
          if (existing?.hospital_id !== body.hospitalId)
            hospitalQuery.whereNull('archived_at');
          if (!(await hospitalQuery.first()))
            throw Object.assign(
              new Error('El centro seleccionado no está disponible.'),
              { status: 422 }
            );
        }
        const patient = {
          id,
          name: body.name.trim(),
          dni,
          dob: body.dob,
          address: body.address.trim(),
          diagnosis: body.diagnosis.trim(),
          hospital_id: body.hospitalId || null,
          complex_situation: Boolean(body.complexSituation),
          updated_at: timestamp,
        };
        if (existing) await trx('patients').where({ id }).update(patient);
        else
          await trx('patients').insert({
            ...patient,
            created_by: this.userId(req),
            created_at: timestamp,
          });
        const caregiver = {
          patient_id: id,
          name: body.caregiver.name.trim(),
          relation: body.caregiver.relation.trim(),
          phone: body.caregiver.phone.trim(),
          lives_with_patient: Boolean(body.caregiver.livesWithPatient),
          burden_level: body.caregiver.burdenLevel || 'Bajo',
          updated_at: timestamp,
        };
        const current = await trx('caregivers')
          .where({ patient_id: id })
          .first();
        if (current)
          await trx('caregivers').where({ patient_id: id }).update(caregiver);
        else
          await trx('caregivers').insert({
            ...caregiver,
            created_at: timestamp,
          });
      });
    } catch (error: any) {
      if (
        error?.code === 'SQLITE_CONSTRAINT' ||
        error?.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        /UNIQUE constraint failed/i.test(error?.message ?? '')
      ) {
        res.status(409).json({ error: 'El DNI ya está registrado.' });
        return;
      }
      if (error?.status) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      throw error;
    }
    const result = await this.db('patients').where({ id }).first();
    res
      .status(req.params.patientId ? 200 : 201)
      .json({ data: await this.patientDto(result) });
  }

  async setPatientArchive(req: Request, res: Response): Promise<void> {
    const at = req.path.endsWith('/restore') ? null : now();
    const count = await this.db('patients')
      .where({ id: req.params.patientId })
      .update({ archived_at: at, updated_at: now() });
    if (!count) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }
    res.json({ success: true });
  }

  async restorePatient(req: Request, res: Response): Promise<void> {
    const roles = await this.db('user_roles')
      .where({ user_id: this.userId(req) })
      .select('role_id');
    if (!roles.some(role => role.role_id === 'coordinator')) {
      res
        .status(403)
        .json({ error: 'Solo coordinadores pueden restaurar pacientes.' });
      return;
    }
    await this.setPatientArchive(req, res);
  }

  async assignPatient(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId;
    const userIds: string[] = Array.isArray(req.body?.volunteerIds)
      ? req.body.volunteerIds
      : [];
    const exists = await this.db('patients').where({ id: patientId }).first();
    if (!exists) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }
    const users = userIds.length
      ? await this.db('users').whereIn('id', userIds).select('id')
      : [];
    if (users.length !== new Set(userIds).size) {
      res.status(422).json({ error: 'Una o más personas no existen.' });
      return;
    }
    await this.db.transaction(async trx => {
      await trx('patient_assignments')
        .where({ patient_id: patientId })
        .delete();
      if (userIds.length)
        await trx('patient_assignments').insert(
          userIds.map(userId => ({
            patient_id: patientId,
            user_id: userId,
            created_by: this.userId(req),
            created_at: now(),
          }))
        );
    });
    res.json({ data: userIds });
  }

  async listHospitals(req: Request, res: Response): Promise<void> {
    const query = this.db('hospitals').orderBy('name');
    if (req.query.includeArchived !== 'true') query.whereNull('archived_at');
    res.json({ data: await query });
  }

  async saveHospital(req: Request, res: Response): Promise<void> {
    const body = req.body ?? {};
    const timestamp = now();
    const id = req.params.hospitalId ?? randomUUID();
    if (!body.name?.trim() || !body.address?.trim()) {
      res.status(422).json({ error: 'Nombre y domicilio son obligatorios.' });
      return;
    }
    const values = {
      name: body.name.trim(),
      address: body.address.trim(),
      zone: body.zone?.trim() ?? null,
      updated_at: timestamp,
    };
    if (req.params.hospitalId) {
      const count = await this.db('hospitals').where({ id }).update(values);
      if (!count) {
        res.status(404).json({ error: 'Centro no encontrado' });
        return;
      }
    } else
      await this.db('hospitals').insert({
        id,
        ...values,
        created_at: timestamp,
        archived_at: null,
      });
    res
      .status(req.params.hospitalId ? 200 : 201)
      .json({ data: await this.db('hospitals').where({ id }).first() });
  }

  async setHospitalArchive(req: Request, res: Response): Promise<void> {
    const archivedAt = req.path.endsWith('/restore') ? null : now();
    const count = await this.db('hospitals')
      .where({ id: req.params.hospitalId })
      .update({ archived_at: archivedAt, updated_at: now() });
    if (!count) {
      res.status(404).json({ error: 'Centro no encontrado' });
      return;
    }
    res.json({ success: true });
  }

  async listFollowUps(req: Request, res: Response): Promise<void> {
    const rows = await this.db('follow_ups as f')
      .join('users as u', 'u.id', 'f.author_id')
      .where({ 'f.patient_id': req.params.patientId })
      .select('f.*', 'u.name as author_name')
      .orderBy('f.occurred_at', 'desc')
      .orderBy('f.id', 'desc');
    const data = await Promise.all(
      rows.map(async (row: any) => ({
        id: row.id,
        patientId: row.patient_id,
        authorId: row.author_id,
        authorName: row.author_name,
        occurredAt: row.occurred_at,
        recordedAt: row.recorded_at,
        date: row.occurred_at,
        contactType: row.contact_type === 'in_person' ? 'Presencial' : 'Remoto',
        durationMinutes: row.duration_minutes,
        durationHours: row.duration_minutes / 60,
        symptoms: parseJson(row.symptoms, {}),
        symptomObservations: row.symptom_observations,
        socialRisk: parseJson(row.social_risk, {}),
        equipmentNeeds: parseJson(row.equipment_needs, []),
        equipmentOther: row.equipment_other,
        interventions: row.interventions,
        alertActivated: Boolean(
          await this.db('alerts').where({ follow_up_id: row.id }).first()
        ),
      }))
    );
    res.json({ data });
  }

  async createFollowUp(req: Request, res: Response): Promise<void> {
    const body = req.body ?? {};
    const duration = Number(
      body.durationMinutes ??
        (body.contactType === 'remote' || body.contactType === 'Remoto'
          ? 60
          : 120)
    );
    if (
      !Number.isInteger(duration) ||
      duration < 15 ||
      duration > 1440 ||
      duration % 15 !== 0
    ) {
      res.status(422).json({
        error:
          'La duración debe ser de 15 a 1440 minutos, en incrementos de 15.',
      });
      return;
    }
    if (
      typeof body.symptomObservations !== 'string' ||
      typeof body.interventions !== 'string'
    ) {
      res
        .status(422)
        .json({ error: 'Observaciones e intervenciones son obligatorias.' });
      return;
    }
    const patient = await this.db('patients')
      .where({ id: req.params.patientId })
      .first();
    if (!patient) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }
    if (patient.archived_at) {
      res.status(409).json({
        error: 'No se pueden registrar seguimientos en pacientes archivados.',
      });
      return;
    }
    const authorId = this.userId(req);
    const mutationId =
      body.clientMutationId ?? req.header('idempotency-key') ?? null;
    const payloadHash = createHash('sha256')
      .update(
        JSON.stringify({
          patientId: patient.id,
          ...body,
          clientMutationId: undefined,
        })
      )
      .digest('hex');
    if (mutationId) {
      const prior = await this.db('follow_ups')
        .where({ author_id: authorId, client_mutation_id: mutationId })
        .first();
      if (prior) {
        if (prior.client_payload_hash !== payloadHash) {
          res.status(409).json({
            error:
              'El identificador de operación ya fue usado con otro contenido.',
          });
          return;
        }
        res.status(200).json({
          data: {
            id: prior.id,
            patientId: prior.patient_id,
            occurredAt: prior.occurred_at,
            recordedAt: prior.recorded_at,
          },
        });
        return;
      }
    }
    const id = randomUUID();
    const timestamp = now();
    const contactType = ['remote', 'Remoto'].includes(body.contactType)
      ? 'remote'
      : 'in_person';
    let createdAlertId: string | null = null;
    try {
      await this.db.transaction(async trx => {
        await trx('follow_ups').insert({
          id,
          patient_id: patient.id,
          author_id: authorId,
          occurred_at: body.occurredAt ?? timestamp,
          recorded_at: timestamp,
          contact_type: contactType,
          duration_minutes: duration,
          symptoms: JSON.stringify(body.symptoms ?? {}),
          symptom_observations: body.symptomObservations,
          social_risk: JSON.stringify(body.socialRisk ?? {}),
          equipment_needs: JSON.stringify(
            body.equipmentNeeds ?? body.equipment ?? []
          ),
          equipment_other: body.equipmentOther ?? '',
          interventions: body.interventions,
          client_mutation_id: mutationId,
          client_payload_hash: payloadHash,
        });
        if (body.alert && typeof body.alert === 'object') {
          createdAlertId = randomUUID();
          await trx('alerts').insert({
            id: createdAlertId,
            patient_id: patient.id,
            follow_up_id: id,
            level: body.alert.level ?? 'standard',
            motive: body.alert.motive ?? 'other',
            observations: body.alert.observations ?? '',
            status: 'active',
            created_by: authorId,
            created_at: timestamp,
          });
        }
      });
    } catch (error: any) {
      if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(409).json({ error: 'Conflicto de idempotencia.' });
        return;
      }
      throw error;
    }
    if (createdAlertId) {
      try {
        await this.notifyAssignedTeam(patient.id, createdAlertId, authorId);
      } catch (error) {
        console.error(
          'Could not notify assigned team about a clinical alert',
          error
        );
      }
    }
    res.status(201).json({
      data: {
        id,
        patientId: patient.id,
        authorId,
        occurredAt: body.occurredAt ?? timestamp,
        recordedAt: timestamp,
        contactType,
        durationMinutes: duration,
      },
    });
  }

  async listAlerts(req: Request, res: Response): Promise<void> {
    const query = this.db('alerts as a')
      .join('patients as p', 'p.id', 'a.patient_id')
      .join('users as u', 'u.id', 'a.created_by')
      .leftJoin('users as resolver', 'resolver.id', 'a.resolved_by')
      .select(
        'a.*',
        'p.name as patient_name',
        'u.name as author_name',
        'resolver.name as resolved_by_name'
      )
      .orderBy('a.created_at', 'desc');
    if (req.query.status === 'active' || req.query.status === 'resolved')
      query.where('a.status', req.query.status);
    if (req.query.patientId)
      query.where('a.patient_id', String(req.query.patientId));
    const rows = await query;
    res.json({
      data: rows.map(row => ({
        id: row.id,
        patientId: row.patient_id,
        patientName: row.patient_name,
        followUpId: row.follow_up_id,
        level: row.level,
        motive: row.motive,
        observations: row.observations,
        status: row.status,
        authorId: row.created_by,
        authorName: row.author_name,
        createdAt: row.created_at,
        resolvedBy: row.resolved_by,
        resolvedByName: row.resolved_by_name,
        resolvedAt: row.resolved_at,
        resolutionNote: row.resolution_note,
      })),
    });
  }

  async createAlert(req: Request, res: Response): Promise<void> {
    const body = req.body ?? {};
    if (!body.level || !body.motive || !body.observations?.trim()) {
      res
        .status(422)
        .json({ error: 'Nivel, motivo y observaciones son obligatorios.' });
      return;
    }
    const patient = await this.db('patients')
      .where({ id: req.params.patientId })
      .first();
    if (!patient) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }
    if (patient.archived_at) {
      res.status(409).json({
        error: 'No se pueden activar alertas en pacientes archivados.',
      });
      return;
    }
    const alert = {
      id: randomUUID(),
      patient_id: patient.id,
      follow_up_id: null,
      level: body.level,
      motive: body.motive,
      observations: body.observations.trim(),
      status: 'active',
      created_by: this.userId(req),
      created_at: now(),
      resolved_by: null,
      resolved_at: null,
      resolution_note: null,
    };
    await this.db('alerts').insert(alert);
    try {
      await this.notifyAssignedTeam(patient.id, alert.id, alert.created_by);
    } catch (error) {
      console.error(
        'Could not notify assigned team about a clinical alert',
        error
      );
    }
    res.status(201).json({ data: alert });
  }

  async resolveAlert(req: Request, res: Response): Promise<void> {
    const count = await this.db('alerts')
      .where({ id: req.params.alertId, status: 'active' })
      .update({
        status: 'resolved',
        resolved_by: this.userId(req),
        resolved_at: now(),
        resolution_note: req.body?.note?.trim() || null,
      });
    if (!count) {
      res.status(404).json({ error: 'Alerta activa no encontrada' });
      return;
    }
    res.json({ success: true });
  }

  async listVolunteers(req: Request, res: Response): Promise<void> {
    const rows = await this.db('volunteer_profiles as vp')
      .join('users as u', 'u.id', 'vp.user_id')
      .where('vp.status', 'active')
      .select('vp.*', 'u.name', 'u.email', 'u.profile_image_id');
    const q = normalizeText(req.query.q);
    const filtered = rows.filter(
      row =>
        !q ||
        [row.name, row.email, row.specialty_availability].some(value =>
          normalizeText(value).includes(q)
        )
    );
    res.json({
      data: await Promise.all(
        filtered.map(async row => ({
          id: row.user_id,
          userId: row.user_id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          specialty: row.specialty_availability,
          tenure: row.tenure,
          avatar: row.avatar_url ?? row.profile_image_id,
          status: row.status,
          activePatients: await this.db('patient_assignments')
            .where({ user_id: row.user_id })
            .count({ count: '*' })
            .first()
            .then(value => Number(value?.count ?? 0)),
        }))
      ),
    });
  }

  async updateMyProfile(req: Request, res: Response): Promise<void> {
    const id = this.userId(req);
    const body = req.body ?? {};
    const existing = await this.db('volunteer_profiles')
      .where({ user_id: id })
      .first();
    const protectedFields = [
      'id',
      'userId',
      'email',
      'name',
      'role',
      'permissions',
      'activePatients',
      'status',
    ];
    if (
      protectedFields.some(field =>
        Object.prototype.hasOwnProperty.call(body, field)
      )
    ) {
      res.status(422).json({
        error:
          'La identidad, los permisos y las asignaciones no se editan desde el perfil.',
      });
      return;
    }
    const validateText = (field: string, maxLength: number): string | null => {
      const value = body[field];
      if (value === undefined || value === null) return null;
      if (typeof value !== 'string' || value.length > maxLength) {
        throw new Error(
          `El campo ${field} debe ser texto de hasta ${maxLength} caracteres.`
        );
      }
      return value.trim() || null;
    };
    let phone: string | null;
    let specialtyAvailability: string | null;
    let tenure: string | null;
    let avatarUrl: string | null;
    try {
      phone = validateText('phone', 40);
      specialtyAvailability = validateText('specialtyAvailability', 240);
      tenure = validateText('tenure', 240);
      avatarUrl = validateText('avatarUrl', 2048);
      if (avatarUrl) {
        const url = new URL(avatarUrl);
        if (!['https:', 'http:'].includes(url.protocol))
          throw new Error('La imagen debe usar una URL HTTP o HTTPS.');
      }
    } catch (error: any) {
      res.status(422).json({ error: error.message });
      return;
    }
    const timestamp = now();
    const profile = {
      user_id: id,
      phone: body.phone === undefined ? (existing?.phone ?? null) : phone,
      specialty_availability:
        body.specialtyAvailability === undefined
          ? (existing?.specialty_availability ?? null)
          : specialtyAvailability,
      tenure: body.tenure === undefined ? (existing?.tenure ?? null) : tenure,
      avatar_url:
        body.avatarUrl === undefined
          ? (existing?.avatar_url ?? null)
          : avatarUrl,
      status: existing?.status ?? 'active',
      updated_at: timestamp,
    };
    await this.db('volunteer_profiles')
      .insert({ ...profile, created_at: timestamp })
      .onConflict('user_id')
      .merge(profile);
    res.json({
      data: {
        userId: id,
        phone: profile.phone,
        specialtyAvailability: profile.specialty_availability,
        tenure: profile.tenure,
        avatarUrl: profile.avatar_url,
        status: profile.status,
      },
    });
  }

  async getMyProfile(req: Request, res: Response): Promise<void> {
    const row = await this.db('volunteer_profiles')
      .where({ user_id: this.userId(req) })
      .first();
    res.json({
      data: row
        ? {
            userId: row.user_id,
            phone: row.phone,
            specialtyAvailability: row.specialty_availability,
            tenure: row.tenure,
            avatarUrl: row.avatar_url,
            status: row.status,
          }
        : null,
    });
  }

  async addVolunteerAllowlist(req: Request, res: Response): Promise<void> {
    const email = String(req.body?.email ?? '')
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(422).json({ error: 'Ingrese un email válido.' });
      return;
    }
    try {
      await this.db('app_settings_allowed_users').insert({
        email,
        created_at: now(),
      });
    } catch (error: any) {
      if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(409).json({ error: 'Ese correo ya está autorizado.' });
        return;
      }
      throw error;
    }
    res.status(201).json({ data: { email, role: 'volunteer' } });
  }

  async listVolunteerAllowlist(_req: Request, res: Response): Promise<void> {
    const rows = await this.db('app_settings_allowed_users')
      .select('email', 'created_at')
      .orderBy('email');
    res.json({
      data: rows.map((row: any) => ({
        id: row.email,
        email: row.email,
        createdAt: row.created_at,
        status: 'Autorizado',
        role: 'Voluntario',
      })),
    });
  }

  async getStats(req: Request, res: Response): Promise<void> {
    const isGlobal = req.path.endsWith('/global');
    const userId = this.userId(req);
    const since = new Date();
    since.setDate(since.getDate() - Number(req.query.periodDays ?? 7));
    const query = this.db('follow_ups').where(
      'occurred_at',
      '>=',
      since.toISOString()
    );
    if (!isGlobal) query.where({ author_id: userId });
    const recent = await query.clone().count({ count: '*' }).first();
    const all = this.db('follow_ups');
    if (!isGlobal) all.where({ author_id: userId });
    const totals = await all
      .select(
        this.db.raw('COUNT(*) as visits'),
        this.db.raw('COALESCE(SUM(duration_minutes), 0) as duration_minutes'),
        this.db.raw('COUNT(DISTINCT patient_id) as patients_attended')
      )
      .first();
    const data: Record<string, number> = {
      visits: Number(totals?.visits ?? 0),
      durationHours: Number(totals?.duration_minutes ?? 0) / 60,
      patientsAttended: Number(totals?.patients_attended ?? 0),
      recentVisits: Number(recent?.count ?? 0),
    };
    if (isGlobal) {
      const [activeAlerts, activePatients, activeVolunteers] =
        await Promise.all([
          this.db('alerts')
            .where({ status: 'active' })
            .count({ count: '*' })
            .first(),
          this.db('patients')
            .whereNull('archived_at')
            .count({ count: '*' })
            .first(),
          this.db('volunteer_profiles')
            .where({ status: 'active' })
            .count({ count: '*' })
            .first(),
        ]);
      Object.assign(data, {
        activeAlerts: Number(activeAlerts?.count ?? 0),
        activePatients: Number(activePatients?.count ?? 0),
        activeVolunteers: Number(activeVolunteers?.count ?? 0),
      });
    }
    res.json({ data });
  }
}
