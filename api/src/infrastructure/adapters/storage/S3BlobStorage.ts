import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import type { BlobStorage, BlobStorageObject } from '@/domain/repositories/BlobStorage';

export interface S3BlobStorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export class S3BlobStorage implements BlobStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: S3BlobStorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
  }

  async get(key: string): Promise<BlobStorageObject | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      const chunks: Uint8Array[] = [];
      const stream = response.Body as AsyncIterable<Uint8Array> | undefined;
      if (!stream) return null;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks);
      return {
        body,
        contentType: response.ContentType ?? 'image/webp',
      };
    } catch (err: any) {
      if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }
}
