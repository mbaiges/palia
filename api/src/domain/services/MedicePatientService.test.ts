import { MedicePatientService } from '@/domain/services/MedicePatientService';
import type { MedicePatientRepository } from '@/domain/repositories/MedicePatientRepository';

const patient = (id: string, name: string, complex = false) => ({
  id,
  name,
  dni: '12.345.678',
  diagnosis: 'Diabetes',
  complex_situation: complex,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
});

describe('MedicePatientService', () => {
  const rows = [patient('1', 'María Pérez'), patient('2', 'Juan Soto', true)];
  const repository: jest.Mocked<MedicePatientRepository> = {
    listPatients: jest.fn().mockResolvedValue(rows),
    findPatientById: jest.fn(async (id) => rows.find((row) => row.id === id)),
    getPatientRelations: jest.fn(async (id) => ({
      caregiver: { name: `Cuidador ${id}`, lives_with_patient: 1 },
      hospital: { name: 'Hospital Central' },
      assignments: [{ user_id: 'volunteer-1' }],
      activeAlerts: id === '1' ? [{ id: 'alert-1' }] : [],
    })),
  };
  const service = new MedicePatientService(repository);

  beforeEach(() => jest.clearAllMocks());

  it('maps patient relationships and lets active alerts override derived state', async () => {
    const dto = await service.findById('1');
    expect(dto).toMatchObject({
      hospitalName: 'Hospital Central',
      currentStatus: 'Alerta',
      activeAlerts: 1,
      assignedVolunteers: ['volunteer-1'],
      caregiver: { name: 'Cuidador 1', livesWithPatient: true },
    });
  });

  it('filters accents and status before returning stable pagination metadata', async () => {
    const result = await service.list({
      includeArchived: false,
      query: 'maria',
      status: 'critical',
      limit: 1,
      offset: 0,
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('1');
    expect(result.page).toEqual({ limit: 1, nextCursor: null, total: 1 });
    expect(repository.listPatients).toHaveBeenCalledWith(false);
  });
});
