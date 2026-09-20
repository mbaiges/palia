import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { DatabaseConfig } from '@/infrastructure/config/database';

@injectable()
export class PingController {
  /**
   * Ping endpoint to check if the API is alive
   * Returns status and timestamp
   */
  public ping(_req: Request, res: Response): void {
    const response = {
      status: 'OK',
      message: 'API is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(response);
  }

  /**
   * Health check endpoint with more detailed information
   */
  public health(_req: Request, res: Response): void {
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(response);
  }

  public live(_req: Request, res: Response): void {
    res.status(200).end();
  }

  public async ready(_req: Request, res: Response): Promise<void> {
    try {
      await DatabaseConfig.getConnection().execute('SELECT 1');
      res.status(200).end();
    } catch {
      res.status(503).end();
    }
  }

  public config(_req: Request, res: Response): void {
    const emailProvider = (process.env.EMAIL_PROVIDER ?? (process.env.RESEND_API_KEY ? 'resend' : 'console')).toLowerCase();
    const clientUrls = (process.env.CLIENT_URL ?? '').split(',').map((url) => url.trim()).filter(Boolean);
    res.status(200).json({
      environment: process.env.NODE_ENV || 'development',
      emailAuthEnabled: !['false', '0'].includes((process.env.EMAIL_AUTH_ENABLED ?? 'true').toLowerCase()),
      emailProviderConfigured: emailProvider === 'console' || (emailProvider === 'resend' && Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)),
      googleProviderConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      httpsClientOrigin: clientUrls.length > 0 && clientUrls.every((url) => url.startsWith('https://')),
    });
  }
}
