import { inject, injectable } from 'tsyringe';
import type { MediceDirectoryRepository } from '@/domain/repositories/MediceDirectoryRepository';
const normalize = (v: unknown) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const failure = (message: string, status: number) => Object.assign(new Error(message), { status });
@injectable()
export class MediceDirectoryService {
  constructor(@inject('MediceDirectoryRepository') private readonly repository: MediceDirectoryRepository) {}
  async volunteers(query: unknown) { const q = normalize(query); const rows = await this.repository.listVolunteers(); return { data: rows.filter((r) => !q || [r.name, r.email, r.specialty_availability].some((v) => normalize(v).includes(q))).map((r) => ({ id: r.user_id, userId: r.user_id, name: r.name, email: r.email, phone: r.phone, specialty: r.specialty_availability, tenure: r.tenure, avatar: r.avatar_url ?? r.profile_image_id, status: r.status, activePatients: Number(r.active_patients ?? 0) })) }; }
  async addAllowlist(emailInput: unknown, actorId: string) { const email = String(emailInput ?? '').trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw failure('Ingrese un email válido.', 422); try { await this.repository.addAllowlist(email, actorId, new Date().toISOString()); } catch (e: any) { if (String(e?.message ?? '').toLowerCase().includes('unique')) throw failure('Ese correo ya está autorizado.', 409); throw e; } return { email, role: 'volunteer' }; }
  async allowlist() { const rows = await this.repository.listAllowlist(); return { data: rows.map((r) => ({ id: r.email, email: r.email, createdAt: r.created_at, status: 'Autorizado', role: 'Voluntario' })) }; }
  stats(userId: string, global: boolean, periodDays: number) { return this.repository.stats(userId, global, periodDays); }
}
