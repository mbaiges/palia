import { container } from '@/infrastructure/config/container';
import { MediaAssetService } from '@/domain/services/MediaAssetService';

export async function runMediaAssetCleanupOnce(): Promise<number> {
  return container.resolve<MediaAssetService>('MediaAssetService').cleanupExpired();
}

export function startMediaAssetCleanupJob(): () => void {
  const intervalMs = Number(process.env.MEDIA_CLEANUP_INTERVAL_MS ?? 60 * 60 * 1000);
  const run = async () => {
    try {
      const deleted = await runMediaAssetCleanupOnce();
      if (deleted > 0) console.log(`[MediaAssetCleanup] Removed ${deleted} expired asset(s)`);
    } catch (error) {
      console.error('[MediaAssetCleanup] Failed:', error);
    }
  };
  void run();
  const interval = setInterval(run, intervalMs);
  interval.unref();
  return () => clearInterval(interval);
}
