import { S3BlobStorage } from '@/infrastructure/adapters/storage/S3BlobStorage';
import type { BlobStorage, BlobStorageObject } from '@/domain/repositories/BlobStorage';

export interface R2BlobStorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export class R2BlobStorage implements BlobStorage {
  private readonly delegate: S3BlobStorage;

  constructor(config: R2BlobStorageConfig) {
    this.delegate = new S3BlobStorage({
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      bucket: config.bucket,
    });
  }

  put(key: string, body: Buffer, contentType: string): Promise<void> {
    return this.delegate.put(key, body, contentType);
  }

  get(key: string): Promise<BlobStorageObject | null> {
    return this.delegate.get(key);
  }

  delete(key: string): Promise<void> {
    return this.delegate.delete(key);
  }
}
