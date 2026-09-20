export interface MediaAsset {
  id: string;
  ownerId: string;
  storageKey: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  createdAt: string;
  expiresAt: string | null;
}
