export interface BlobStorageObject {
  body: Buffer;
  contentType: string;
}

export interface BlobStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<BlobStorageObject | null>;
  delete(key: string): Promise<void>;
}
