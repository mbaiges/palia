import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import type { PushSubscriptionRepository } from '@/domain/repositories/PushSubscriptionRepository';
import { AuthenticatedUser } from '@/domain/models/AuthenticatedUser';
import { parseAcceptLanguage } from '@/infrastructure/i18n';

interface PushSubscriptionBody {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

@injectable()
export class PushController {
  constructor(
    @inject('PushSubscriptionRepository')
    private readonly pushRepo: PushSubscriptionRepository
  ) {}

  private getUser(req: Request): AuthenticatedUser {
    const user = (req as any).user as AuthenticatedUser;
    if (!user) throw new Error('Unauthorized');
    return user;
  }

  async subscribe(req: Request, res: Response): Promise<void> {
    try {
      const user = this.getUser(req);
      const body = req.body as PushSubscriptionBody;
      const { subscription } = body;

      if (
        !subscription?.endpoint ||
        !subscription?.keys?.p256dh ||
        !subscription?.keys?.auth
      ) {
        res.status(400).json({
          error:
            'Invalid subscription: endpoint and keys.p256dh, keys.auth required',
        });
        return;
      }

      const locale = parseAcceptLanguage(req.headers?.['accept-language']);
      await this.pushRepo.save(user.id, {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        locale,
      });
      res.status(204).send();
    } catch (error: any) {
      res
        .status(error.message === 'Unauthorized' ? 401 : 500)
        .json({ error: error.message });
    }
  }

  async unsubscribe(req: Request, res: Response): Promise<void> {
    try {
      const user = this.getUser(req);
      const body = req.body as { endpoint?: string };
      const { endpoint } = body;

      if (!endpoint) {
        res.status(400).json({ error: 'endpoint is required' });
        return;
      }

      await this.pushRepo.deleteByUserAndEndpoint(user.id, endpoint);
      res.status(204).send();
    } catch (error: any) {
      res
        .status(error.message === 'Unauthorized' ? 401 : 500)
        .json({ error: error.message });
    }
  }

  getVapidPublic(req: Request, res: Response): void {
    try {
      this.getUser(req);
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      if (!publicKey) {
        res.status(503).json({ error: 'Push notifications not configured' });
        return;
      }
      res.json({ publicKey });
    } catch (error: any) {
      res
        .status(error.message === 'Unauthorized' ? 401 : 500)
        .json({ error: error.message });
    }
  }
}
