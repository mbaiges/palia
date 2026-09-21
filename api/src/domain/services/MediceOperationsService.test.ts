import { MediceOperationsService } from '@/domain/services/MediceOperationsService';
import type { MediceOperationsRepository } from '@/domain/repositories/MediceOperationsRepository';

describe('MediceOperationsService', () => {
  const repository: jest.Mocked<MediceOperationsRepository> = {
    listHospitals: jest.fn().mockResolvedValue([]),
    saveHospital: jest.fn(async (id, values, _create) => ({ id, ...values })),
    setHospitalArchived: jest.fn().mockResolvedValue(true),
    patientExists: jest.fn().mockResolvedValue(true),
    existingUserIds: jest.fn(async (ids) => ids),
    replacePatientAssignments: jest.fn().mockResolvedValue(undefined),
  };
  const service = new MediceOperationsService(repository);

  beforeEach(() => jest.clearAllMocks());

  it('validates hospital data and passes normalized values to persistence', async () => {
    await expect(service.saveHospital({
      id: 'hospital-1', name: ' ', address: 'Calle 1', zone: null,
      timestamp: '2026-01-01T00:00:00.000Z',
    })).rejects.toMatchObject({ status: 422 });
    await service.saveHospital({
      id: 'hospital-1', name: ' Centro ', address: ' Calle 1 ', zone: ' Zona ',
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    expect(repository.saveHospital).toHaveBeenCalledWith(
      'hospital-1',
      { name: 'Centro', address: 'Calle 1', zone: 'Zona', updated_at: '2026-01-01T00:00:00.000Z' },
      false,
    );
  });

  it('deduplicates assignments, rejects unknown users and persists valid changes', async () => {
    repository.existingUserIds.mockResolvedValueOnce(['user-1']);
    await expect(service.assignPatient(
      'patient-1', ['user-1', 'missing'], 'admin-1', '2026-01-01T00:00:00.000Z',
    )).rejects.toMatchObject({ status: 422 });
    await expect(service.assignPatient(
      'patient-1', ['user-1', 'user-1'], 'admin-1', '2026-01-01T00:00:00.000Z',
    )).resolves.toEqual(['user-1']);
    expect(repository.replacePatientAssignments).toHaveBeenCalledWith(
      'patient-1', ['user-1'], 'admin-1', '2026-01-01T00:00:00.000Z',
    );
  });
});
