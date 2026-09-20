import type { BlobStorage } from '@/domain/repositories/BlobStorage';
import { shouldUseLocalMediaStorage } from '@/domain/utils/mediaConfig';
import { LocalBlobStorage } from '@/infrastructure/adapters/storage/LocalBlobStorage';
import { R2BlobStorage } from '@/infrastructure/adapters/storage/R2BlobStorage';
import { S3BlobStorage } from '@/infrastructure/adapters/storage/S3BlobStorage';

export function createBlobStorage(): BlobStorage {
  if (shouldUseLocalMediaStorage()) {
    return new LocalBlobStorage(process.env.MEDIA_LOCAL_PATH ?? './data/media');
  }

  const filebaseAccessKeyId = process.env.FILEBASE_ACCESS_KEY_ID;
  const filebaseSecretAccessKey = process.env.FILEBASE_SECRET_ACCESS_KEY;
  const filebaseBucket = process.env.FILEBASE_BUCKET_NAME;

  if (filebaseAccessKeyId && filebaseSecretAccessKey && filebaseBucket) {
    return new S3BlobStorage({
      endpoint: process.env.FILEBASE_ENDPOINT ?? 'https://s3.filebase.io',
      region: 'auto',
      accessKeyId: filebaseAccessKeyId,
      secretAccessKey: filebaseSecretAccessKey,
      bucket: filebaseBucket,
    });
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (accountId && accessKeyId && secretAccessKey && bucket) {
    return new R2BlobStorage({ accountId, accessKeyId, secretAccessKey, bucket });
  }

  return new LocalBlobStorage(process.env.MEDIA_LOCAL_PATH ?? './data/media');
}
