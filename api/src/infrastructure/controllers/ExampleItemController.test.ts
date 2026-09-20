import { ExampleItemController } from './ExampleItemController';

const service = {
  listForUser: jest.fn(),
  listAll: jest.fn(),
  create: jest.fn(),
};

const response = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('ExampleItemController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists the authenticated user items', async () => {
    service.listForUser.mockResolvedValue([{ id: 'item-1' }]);
    const res = response();
    await new ExampleItemController(service as never, { createExampleNotification: jest.fn() } as never).listMine({ user: { id: 'user-1' } } as never, res as never);
    expect(service.listForUser).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith({ items: [{ id: 'item-1' }] });
  });

  it('creates an item for the authenticated user', async () => {
    service.create.mockResolvedValue({ id: 'item-1', title: 'Example' });
    const res = response();
    await new ExampleItemController(service as never, { createExampleNotification: jest.fn() } as never).create({ user: { id: 'user-1' }, body: { title: 'Example' } } as never, res as never);
    expect(service.create).toHaveBeenCalledWith('user-1', { title: 'Example' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ item: { id: 'item-1', title: 'Example' } });
  });
});
