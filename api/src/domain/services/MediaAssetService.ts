import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';
import type { MediaAsset } from '@/domain/models/MediaAsset';
import type { BlobStorage } from '@/domain/repositories/BlobStorage';
import type { MediaAssetRepository } from '@/domain/repositories/MediaAssetRepository';

const MAX_UPLOAD_BYTES = Number(process.env.MEDIA_MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);
const MAX_DIMENSION = Number(process.env.MEDIA_MAX_DIMENSION ?? 1600);
const TTL_DAYS = Number(process.env.MEDIA_TTL_DAYS ?? 30);

@injectable()
export class MediaAssetService {
  constructor(
    @inject('BlobStorage') private readonly storage: BlobStorage,
    @inject('MediaAssetRepository') private readonly repository: MediaAssetRepository,
  ) {}

  private async normalize(input: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
    if (!input.length || input.length > MAX_UPLOAD_BYTES) throw new AppError('Invalid or oversized image', ErrorCode.INVALID_INPUT);
    try {
      const result = await sharp(input, { failOn: 'error' })
        .rotate()
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      return { data: result.data, width: result.info.width, height: result.info.height };
    } catch {
      throw new AppError('Invalid or unsupported image file', ErrorCode.INVALID_INPUT);
    }
  }

  private parseDataUrl(dataUrl: string): Buffer {
    const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl.trim());
    if (!match) throw new AppError('Expected a base64 PNG, JPEG, or WebP data URL', ErrorCode.INVALID_INPUT);
    return Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  }

  async create(ownerId: string, input: Buffer | string): Promise<MediaAsset> {
    const source = typeof input === 'string' ? this.parseDataUrl(input) : input;
    const normalized = await this.normalize(source);
    const id = uuidv4();
    const now = new Date();
    const asset: MediaAsset = {
      id, ownerId, storageKey: `media/${id}.webp`, mimeType: 'image/webp',
      byteSize: normalized.data.length, width: normalized.width, height: normalized.height,
      createdAt: now.toISOString(),
      expiresAt: TTL_DAYS > 0 ? new Date(now.getTime() + TTL_DAYS * 86400000).toISOString() : null,
    };
    await this.storage.put(asset.storageKey, normalized.data, asset.mimeType);
    try { await this.repository.create(asset); } catch (error) { await this.storage.delete(asset.storageKey); throw error; }
    return asset;
  }

  async listForUser(ownerId: string): Promise<MediaAsset[]> { return this.repository.findByOwnerId(ownerId); }
  async listAll(): Promise<MediaAsset[]> { return this.repository.findAll(); }

  async cleanupExpired(limit = 500): Promise<number> {
    const expired = await this.repository.findExpired(new Date().toISOString(), limit);
    for (const asset of expired) {
      await this.storage.delete(asset.storageKey);
      await this.repository.deleteById(asset.id);
    }
    return expired.length;
  }

  async getForUser(id: string, ownerId: string): Promise<{ asset: MediaAsset; body: Buffer }> {
    const asset = await this.repository.findById(id);
    if (!asset) throw new AppError('Media asset not found', ErrorCode.NOT_FOUND);
    if (asset.ownerId !== ownerId) throw new AppError('Access denied', ErrorCode.FORBIDDEN);
    if (asset.expiresAt && new Date(asset.expiresAt) <= new Date()) throw new AppError('Media asset expired', ErrorCode.MEDIA_EXPIRED);
    const object = await this.storage.get(asset.storageKey);
    if (!object) throw new AppError('Media asset not found', ErrorCode.NOT_FOUND);
    return { asset, body: object.body };
  }
}
