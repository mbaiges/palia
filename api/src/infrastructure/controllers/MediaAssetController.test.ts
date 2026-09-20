import { MediaAssetController } from './MediaAssetController';

const service = {
  create: jest.fn(),
  listForUser: jest.fn(),
  listAll: jest.fn(),
  getForUser: jest.fn(),
};

const response = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  setHeader: jest.fn(),
  send: jest.fn(),
});

describe('MediaAssetController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects multipart requests without a file', async () => {
    const res = response();
    await new MediaAssetController(service as never).uploadMultipart({ user: { id: 'user-1' } } as never, res as never);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'file is required' });
  });

  it('creates and returns a data-url asset', async () => {
    service.create.mockResolvedValue({ id: 'asset-1', mimeType: 'image/webp' });
    const res = response();
    await new MediaAssetController(service as never).uploadDataUrl({ user: { id: 'user-1' }, body: { data_url: 'data:image/png;base64,fixture' } } as never, res as never);
    expect(service.create).toHaveBeenCalledWith('user-1', 'data:image/png;base64,fixture');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ asset: { id: 'asset-1', mimeType: 'image/webp' } });
  });
});
