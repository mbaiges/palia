import { ExampleItemService } from './ExampleItemService';
import type { ExampleItemRepository } from '@/domain/repositories/ExampleItemRepository';

describe('ExampleItemService', () => {
  const repository: jest.Mocked<ExampleItemRepository> = {
    findByOwnerId: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  };
  const service = new ExampleItemService(repository);

  beforeEach(() => jest.clearAllMocks());

  it('lists items for the authenticated owner', async () => {
    repository.findByOwnerId.mockResolvedValue([]);
    await expect(service.listForUser('user-1')).resolves.toEqual([]);
    expect(repository.findByOwnerId).toHaveBeenCalledWith('user-1');
  });

  it('rejects empty or overlong titles', async () => {
    await expect(service.create('user-1', { title: ' ' })).rejects.toMatchObject({ errorCode: 'INVALID_INPUT' });
    await expect(service.create('user-1', { title: 'x'.repeat(121) })).rejects.toMatchObject({ errorCode: 'INVALID_INPUT' });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('creates a valid generic item', async () => {
    const item = { id: 'item-1', ownerId: 'user-1', title: 'Hello', description: '', status: 'active' as const, imageId: null, createdAt: 'now', updatedAt: 'now' };
    repository.create.mockResolvedValue(item);
    await expect(service.create('user-1', { title: ' Hello ' })).resolves.toEqual(item);
    expect(repository.create).toHaveBeenCalledWith('user-1', { title: 'Hello' });
  });
});
