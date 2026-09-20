import type { MediaAsset } from '@/domain/models/MediaAsset';

export interface MediaAssetRepository {
  create(asset: MediaAsset): Promise<void>;
  findById(id: string): Promise<MediaAsset | null>;
  findByOwnerId(ownerId: string): Promise<MediaAsset[]>;
  findAll(): Promise<MediaAsset[]>;
  findExpired(now: string, limit?: number): Promise<MediaAsset[]>;
  deleteById(id: string): Promise<void>;
}
