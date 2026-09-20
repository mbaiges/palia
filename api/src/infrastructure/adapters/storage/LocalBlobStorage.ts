import fs from 'fs/promises';
import path from 'path';
import type { BlobStorage, BlobStorageObject } from '@/domain/repositories/BlobStorage';

export class LocalBlobStorage implements BlobStorage {
  constructor(private readonly baseDir: string) {}

  private resolveKey(key: string): string {
    const normalized = key.replace(/\\/g, '/').replace(/^\/+/, '');
    const full = path.resolve(this.baseDir, normalized);
    const base = path.resolve(this.baseDir);
    if (!full.startsWith(base)) {
      throw new Error('Invalid storage key');
    }
    return full;
  }

  async put(key: string, body: Buffer, _contentType: string): Promise<void> {
    const filePath = this.resolveKey(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body);
  }

  async get(key: string): Promise<BlobStorageObject | null> {
    const filePath = this.resolveKey(key);
    try {
      const body = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = ext === '.webp' ? 'image/webp' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
      return { body, contentType };
    } catch (err: any) {
      if (err?.code === 'ENOENT') return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolveKey(key);
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err?.code !== 'ENOENT') throw err;
    }
  }
}
