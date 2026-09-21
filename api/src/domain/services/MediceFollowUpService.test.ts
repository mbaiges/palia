import { MediceFollowUpService } from '@/domain/services/MediceFollowUpService';
import type { MediceFollowUpRepository } from '@/domain/repositories/MediceFollowUpRepository';
import type { ClinicalAlertNotifier } from '@/domain/repositories/ClinicalAlertNotifier';

describe('MediceFollowUpService', () => {
  const repository: jest.Mocked<MediceFollowUpRepository> = {
    findPatient: jest.fn().mockResolvedValue({ id: 'patient-1', archived_at: null }),
    findByMutation: jest.fn().mockResolvedValue(undefined),
    listForPatient: jest.fn().mockResolvedValue([]),
    hasAlertForFollowUp: jest.fn().mockResolvedValue(false),
    createFollowUp: jest.fn().mockResolvedValue(undefined),
    findAssignedActiveUserIds: jest.fn().mockResolvedValue([]),
  };
  const notifications: ClinicalAlertNotifier = { sendGenericClinicalAlert: jest.fn() };
  const service = new MediceFollowUpService(repository, notifications);

  it('rejects durations outside the canonical fifteen minute range', async () => {
    await expect(service.create({
      patientId: 'patient-1', authorId: 'user-1', body: {
        durationMinutes: 10, symptomObservations: '', interventions: '',
      },
    })).rejects.toMatchObject({ status: 422 });
  });

  it('persists a valid follow-up and returns the canonical response', async () => {
    const result = await service.create({
      patientId: 'patient-1', authorId: 'user-1', body: {
        durationMinutes: 30, contactType: 'remote', symptomObservations: '', interventions: '',
      },
    });
    expect(result.status).toBe(201);
    expect(result.data).toMatchObject({ patientId: 'patient-1', authorId: 'user-1', durationMinutes: 30 });
    expect(repository.createFollowUp).toHaveBeenCalled();
  });
});
