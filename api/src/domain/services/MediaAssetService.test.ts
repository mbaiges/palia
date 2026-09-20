import { MediaAssetService } from './MediaAssetService';
import type { BlobStorage } from '@/domain/repositories/BlobStorage';
import type { MediaAssetRepository } from '@/domain/repositories/MediaAssetRepository';

describe('MediaAssetService.cleanupExpired', () => {
  it('removes expired blobs and database rows', async () => {
    const storage: jest.Mocked<BlobStorage> = { put: jest.fn(), get: jest.fn(), delete: jest.fn() };
    const repository: jest.Mocked<MediaAssetRepository> = {
      create: jest.fn(), findById: jest.fn(), findByOwnerId: jest.fn(), findAll: jest.fn(),
      findExpired: jest.fn().mockResolvedValue([{ id: 'asset-1', ownerId: 'user-1', storageKey: 'media/asset-1.webp', mimeType: 'image/webp', byteSize: 10, width: 1, height: 1, createdAt: '', expiresAt: '' }]),
      deleteById: jest.fn(),
    };
    const service = new MediaAssetService(storage, repository);
    await expect(service.cleanupExpired()).resolves.toBe(1);
    expect(storage.delete).toHaveBeenCalledWith('media/asset-1.webp');
    expect(repository.deleteById).toHaveBeenCalledWith('asset-1');
  });
});
