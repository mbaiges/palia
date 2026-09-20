export function isMediaEnabled(): boolean {
  return !['false', '0'].includes((process.env.MEDIA_ENABLED ?? 'true').toLowerCase());
}

export function getMediaTtlDays(): number {
  const value = Number.parseInt(process.env.MEDIA_TTL_DAYS ?? '10', 10);
  return Number.isFinite(value) && value > 0 ? value : 10;
}

export function getMediaMaxUploadBytes(): number {
  const value = Number.parseInt(process.env.MEDIA_MAX_UPLOAD_BYTES ?? '10485760', 10);
  return Number.isFinite(value) && value > 0 ? value : 10 * 1024 * 1024;
}

export function getMediaMaxDimension(): number {
  const value = Number.parseInt(process.env.MEDIA_MAX_DIMENSION ?? '1600', 10);
  return Number.isFinite(value) && value > 0 ? value : 1600;
}

export function getMediaWebpQuality(): number {
  const value = Number.parseInt(process.env.MEDIA_WEBP_QUALITY ?? '80', 10);
  return Number.isFinite(value) && value > 0 && value <= 100 ? value : 80;
}

export function shouldUseLocalMediaStorage(): boolean {
  return ['true', '1'].includes((process.env.MEDIA_USE_LOCAL ?? 'true').toLowerCase());
}

export function getMediaCleanupIntervalMs(): number {
  const value = Number.parseInt(process.env.MEDIA_CLEANUP_INTERVAL_MS ?? '', 10);
  return Number.isFinite(value) && value >= 5_000 ? value : 6 * 60 * 60 * 1000;
}
