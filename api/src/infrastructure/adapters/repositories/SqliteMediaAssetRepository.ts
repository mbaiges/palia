import type { Client } from '@libsql/client';
import type { MediaAsset } from '@/domain/models/MediaAsset';
import type { MediaAssetRepository } from '@/domain/repositories/MediaAssetRepository';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { execute, queryAll, queryOne } from '@/infrastructure/db/libsql';

type MediaAssetRow = {
  id: string; owner_id: string; storage_key: string; mime_type: string;
  byte_size: number; width: number; height: number; created_at: string; expires_at: string | null;
};

const mapRow = (row: MediaAssetRow): MediaAsset => ({
  id: row.id, ownerId: row.owner_id, storageKey: row.storage_key, mimeType: row.mime_type,
  byteSize: row.byte_size, width: row.width, height: row.height,
  createdAt: row.created_at, expiresAt: row.expires_at,
});

export class SqliteMediaAssetRepository implements MediaAssetRepository {
  private readonly client: Client = DatabaseConfig.getConnection();

  async create(asset: MediaAsset): Promise<void> {
    await execute(this.client,
      'INSERT INTO media_assets (id, owner_id, storage_key, mime_type, byte_size, width, height, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [asset.id, asset.ownerId, asset.storageKey, asset.mimeType, asset.byteSize, asset.width, asset.height, asset.createdAt, asset.expiresAt]);
  }

  async findById(id: string): Promise<MediaAsset | null> {
    const row = await queryOne<MediaAssetRow>(this.client, 'SELECT * FROM media_assets WHERE id = ?', [id]);
    return row ? mapRow(row) : null;
  }

  async findByOwnerId(ownerId: string): Promise<MediaAsset[]> {
    const rows = await queryAll<MediaAssetRow>(this.client, 'SELECT * FROM media_assets WHERE owner_id = ? ORDER BY created_at DESC', [ownerId]);
    return rows.map(mapRow);
  }

  async findAll(): Promise<MediaAsset[]> {
    const rows = await queryAll<MediaAssetRow>(this.client, 'SELECT * FROM media_assets ORDER BY created_at DESC');
    return rows.map(mapRow);
  }

  async findExpired(now: string, limit = 500): Promise<MediaAsset[]> {
    const rows = await queryAll<MediaAssetRow>(this.client, 'SELECT * FROM media_assets WHERE expires_at IS NOT NULL AND expires_at <= ? ORDER BY expires_at ASC LIMIT ?', [now, Math.min(Math.max(limit, 1), 500)]);
    return rows.map(mapRow);
  }

  async deleteById(id: string): Promise<void> {
    await execute(this.client, 'DELETE FROM media_assets WHERE id = ?', [id]);
  }
}
