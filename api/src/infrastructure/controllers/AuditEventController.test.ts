import { AuditEventController } from './AuditEventController';
import { auditEventService } from '@/infrastructure/services/AuditEventService';

const response = () => ({
  json: jest.fn(),
  setHeader: jest.fn(),
});

describe('AuditEventController', () => {
  afterEach(() => jest.restoreAllMocks());

  it('lists filtered generic audit events', async () => {
    const events = [{ id: 'event-1', action: 'example_item.created' }];
    jest.spyOn(auditEventService, 'list').mockResolvedValue(events as never);
    const res = response();

    await new AuditEventController().list({ query: { action: 'example_item.created', entity_type: 'example_item', limit: '25' } } as never, res as never);

    expect(auditEventService.list).toHaveBeenCalledWith({ action: 'example_item.created', entityType: 'example_item', limit: 25 });
    expect(res.json).toHaveBeenCalledWith({ events });
  });

  it('exports filtered events as a downloadable JSON response', async () => {
    const events = [{ id: 'event-2', action: 'admin.user_updated' }];
    jest.spyOn(auditEventService, 'list').mockResolvedValue(events as never);
    const res = response();

    await new AuditEventController().export({ query: {} } as never, res as never);

    expect(auditEventService.list).toHaveBeenCalledWith({ action: undefined, entityType: undefined, limit: 500 });
    expect(res.setHeader).toHaveBeenNthCalledWith(1, 'Content-Type', 'application/json');
    expect(res.setHeader).toHaveBeenNthCalledWith(2, 'Content-Disposition', 'attachment; filename="audit-events.json"');
    expect(res.json).toHaveBeenCalledWith({ events });
  });
});
