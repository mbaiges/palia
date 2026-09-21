import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import type { Knex } from 'knex';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { container } from '@/infrastructure/config/container';
import type { AuthenticatedRequest } from '@/infrastructure/middleware/authMiddleware';
import { MedicePatientService } from '@/domain/services/MedicePatientService';
import { inject, injectable } from 'tsyringe';
import { MediceOperationsService } from '@/domain/services/MediceOperationsService';
import { MediceFollowUpService } from '@/domain/services/MediceFollowUpService';
import { MediceAlertService } from '@/domain/services/MediceAlertService';
import { MediceProfileService } from '@/domain/services/MediceProfileService';
import { GenericNotificationService } from '@/infrastructure/services/GenericNotificationService';

const now = () => new Date().toISOString();
const digits = (value: unknown) => String(value ?? '').replace(/\D/g, '');
const normalizeText = (value: unknown) =>
  String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const parseJson = (value: unknown, fallback: unknown = null) => {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
};

@injectable()
export class MediceController {
  constructor(
    @inject('MedicePatientService')
    private readonly patientService: MedicePatientService,
    @inject('MediceOperationsService')
    private readonly operationsService: MediceOperationsService,
    @inject('MediceFollowUpService')
    private readonly followUpService: MediceFollowUpService,
    @inject('MediceAlertService')
    private readonly alertService: MediceAlertService,
    @inject('MediceProfileService')
    private readonly profileService: MediceProfileService,
  ) {}
  private get db(): Knex {
    return DatabaseConfig.getKnex();
  }
  private userId(req: Request): string {
    return (req as AuthenticatedRequest).user!.id;
  }

  private async recordAudit(
    trx: Knex.Transaction,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string | null,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    await trx('audit_events').insert({
      id: randomUUID(),
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata_json: JSON.stringify(metadata),
      created_at: now(),
    });
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
      patientRows.map((row: any) => this.patientService.getDto(row))
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
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
    const offset = Math.max(0, Number(req.query.cursor ?? 0));
    res.json(await this.patientService.list({
      includeArchived,
      query: req.query.q,
      status: String(req.query.status ?? 'all'),
      limit,
      offset,
    }));
  }

  async getPatient(req: Request, res: Response): Promise<void> {
    const data = await this.patientService.findById(req.params.patientId);
    if (!data) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }
    res.json({ data });
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
        if (existing) {
          const expectedUpdatedAt = Date.parse(String(body.updatedAt ?? ''));
          const currentUpdatedAt = Date.parse(String(existing.updated_at));
          if (
            !Number.isFinite(expectedUpdatedAt) ||
            expectedUpdatedAt !== currentUpdatedAt
          )
            throw Object.assign(
              new Error(
                'La ficha cambió desde que la abriste. Recargá los datos antes de guardar.',
              ),
              { status: 409 }
            );
        }
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
        await this.recordAudit(
          trx,
          this.userId(req),
          existing ? 'patient.updated' : 'patient.created',
          'patient',
          id,
          { fields: ['patient', 'caregiver'] },
        );
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
      .json({ data: await this.patientService.getDto(result) });
  }

  async setPatientArchive(req: Request, res: Response): Promise<void> {
    const at = req.path.endsWith('/restore') ? null : now();
    const count = await this.db.transaction(async trx => {
      const affected = await trx('patients')
        .where({ id: req.params.patientId })
        .update({ archived_at: at, updated_at: now() });
      if (affected)
        await this.recordAudit(
          trx,
          this.userId(req),
          at ? 'patient.archived' : 'patient.restored',
          'patient',
          req.params.patientId,
        );
      return affected;
    });
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
    const userIds: string[] = Array.isArray(req.body?.volunteerIds)
      ? req.body.volunteerIds
      : [];
    try {
      const data = await this.operationsService.assignPatient(
        req.params.patientId, userIds, this.userId(req), now(),
      );
      res.json({ data });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      throw error;
    }
  }

  async listHospitals(req: Request, res: Response): Promise<void> {
    res.json({ data: await this.operationsService.listHospitals(req.query.includeArchived === 'true') });
  }

  async saveHospital(req: Request, res: Response): Promise<void> {
    const body = req.body ?? {};
    try {
      const data = await this.operationsService.saveHospital({
        id: req.params.hospitalId,
        name: body.name,
        address: body.address,
        zone: body.zone,
        timestamp: now(),
      });
      res.status(req.params.hospitalId ? 200 : 201).json({ data });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      throw error;
    }
  }

  async setHospitalArchive(req: Request, res: Response): Promise<void> {
    const timestamp = now();
    try {
      await this.operationsService.setHospitalArchived(
        req.params.hospitalId, !req.path.endsWith('/restore'), timestamp,
      );
      res.json({ success: true });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      throw error;
    }
  }

  async listFollowUps(req: Request, res: Response): Promise<void> {
    res.json({ data: await this.followUpService.list(req.params.patientId) });
  }

  async createFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.followUpService.create({
        patientId: req.params.patientId,
        authorId: this.userId(req),
        body: req.body ?? {},
        idempotencyKey: req.header('idempotency-key') ?? null,
      });
      res.status(result.status).json({ data: result.data });
    } catch (error: any) {
      if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(409).json({ error: 'Conflicto de idempotencia.' });
        return;
      }
      if (error?.status) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      throw error;
    }
  }
  async listAlerts(req: Request, res: Response): Promise<void> {
    const requestedLimit = Number(req.query.limit ?? 50);
    const requestedCursor = Number(req.query.cursor ?? 0);
    const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 50;
    const offset = Number.isFinite(requestedCursor) ? Math.max(0, Math.floor(requestedCursor)) : 0;
    res.json(await this.alertService.list({
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      patientId: typeof req.query.patientId === 'string' ? req.query.patientId : undefined,
      limit, offset,
    }));
  }

  async createAlert(req: Request, res: Response): Promise<void> {
    try {
      const alert = await this.alertService.create(req.params.patientId, this.userId(req), req.body ?? {});
      try { await this.notifyAssignedTeam(req.params.patientId, alert.id, this.userId(req)); } catch (error) { console.error('Could not notify assigned team about a clinical alert', error); }
      res.status(201).json({ data: alert });
    } catch (error: any) {
      if (error.status) { res.status(error.status).json({ error: error.message }); return; }
      throw error;
    }
  }

  async resolveAlert(req: Request, res: Response): Promise<void> {
    const result = await this.alertService.resolve(req.params.alertId, this.userId(req), req.body?.note);
    if (!result) { res.status(404).json({ error: 'Alerta activa no encontrada' }); return; }
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
    try { res.json({ data: await this.profileService.update(this.userId(req), req.body ?? {}) }); }
    catch (error: any) { if (error.status) { res.status(error.status).json({ error: error.message }); return; } throw error; }
  }

  async getMyProfile(req: Request, res: Response): Promise<void> {
    const data = await this.profileService.get(this.userId(req));
    if (!data) { res.status(404).json({ error: 'Perfil no encontrado' }); return; }
    res.json({ data });
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
      await this.db.transaction(async trx => {
        await trx('app_settings_allowed_users').insert({
          email,
          created_at: now(),
        });
        await this.recordAudit(
          trx,
          this.userId(req),
          'access.allowlist_added',
          'allowlist',
          null,
        );
      });
    } catch (error: any) {
      const databaseCode = String(error?.code ?? '');
      const databaseMessage = String(error?.message ?? '').toLowerCase();
      if (
        databaseCode.includes('CONSTRAINT') &&
        databaseMessage.includes('app_settings_allowed_users.email')
      ) {
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

