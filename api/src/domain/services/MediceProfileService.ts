import { inject, injectable } from 'tsyringe';
import type { MediceProfileRepository } from '@/domain/repositories/MediceProfileRepository';

const protectedFields = ['id', 'userId', 'email', 'name', 'role', 'permissions', 'activePatients', 'status'];
const failure = (message: string) => Object.assign(new Error(message), { status: 422 });

@injectable()
export class MediceProfileService {
  constructor(@inject('MediceProfileRepository') private readonly repository: MediceProfileRepository) {}
  async update(userId: string, body: any) {
    if (protectedFields.some((field) => Object.prototype.hasOwnProperty.call(body, field))) throw failure('La identidad, los permisos y las asignaciones no se editan desde el perfil.');
    const text = (field: string, max: number) => { const value = body[field]; if (value === undefined || value === null) return null; if (typeof value !== 'string' || value.length > max) throw failure(`El campo ${field} debe ser texto de hasta ${max} caracteres.`); return value.trim() || null; };
    const avatar = text('avatarUrl', 2048); if (avatar) { const url = new URL(avatar); if (!['http:', 'https:'].includes(url.protocol)) throw failure('La imagen debe usar una URL HTTP o HTTPS.'); }
    const current = await this.repository.find(userId); const profile = {
      user_id: userId, phone: body.phone === undefined ? current?.phone ?? null : text('phone', 40),
      specialty_availability: body.specialtyAvailability === undefined ? current?.specialty_availability ?? null : text('specialtyAvailability', 240),
      tenure: body.tenure === undefined ? current?.tenure ?? null : text('tenure', 240),
      avatar_url: body.avatarUrl === undefined ? current?.avatar_url ?? null : avatar,
      status: current?.status ?? 'active',
    };
    await this.repository.save(userId, profile, new Date().toISOString());
    return { userId, phone: profile.phone, specialtyAvailability: profile.specialty_availability, tenure: profile.tenure, avatarUrl: profile.avatar_url, status: profile.status };
  }
  async get(userId: string) { const row = await this.repository.find(userId); if (!row) return null; return { userId, phone: row.phone, specialtyAvailability: row.specialty_availability, tenure: row.tenure, avatarUrl: row.avatar_url, status: row.status, activePatients: await this.repository.assignmentCount(userId) }; }
}
