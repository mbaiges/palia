import 'reflect-metadata';
import { PushController } from '@/infrastructure/controllers/PushController';
import type { PushSubscriptionRepository } from '@/domain/repositories/PushSubscriptionRepository';
import { Request, Response } from 'express';
import { AuthenticatedUser } from '@/domain/models/AuthenticatedUser';

const mockUser = new AuthenticatedUser(
  'user1',
  'google-1',
  'test@test.com',
  'Test User'
);

describe('PushController', () => {
  let pushController: PushController;
  let mockPushRepo: jest.Mocked<PushSubscriptionRepository>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;
  let mockSend: jest.Mock;

  beforeEach(() => {
    mockPushRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      findByUserId: jest.fn(),
      deleteByUserAndEndpoint: jest.fn().mockResolvedValue(undefined),
      deleteByEndpoint: jest.fn().mockResolvedValue(undefined),
      deleteByEndpointIfExists: jest.fn(),
    } as any;
    pushController = new PushController(mockPushRepo);
    mockJson = jest.fn();
    mockSend = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson, send: mockSend });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
      send: mockSend,
    };
    mockRequest = {
      user: mockUser,
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.VAPID_PUBLIC_KEY;
  });

  describe('subscribe', () => {
    it('should return 204 and save subscription when valid', async () => {
      mockRequest.body = {
        subscription: {
          endpoint: 'https://push.example.com/1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
      };

      await pushController.subscribe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPushRepo.save).toHaveBeenCalledWith('user1', {
        endpoint: 'https://push.example.com/1',
        keys: { p256dh: 'key1', auth: 'auth1' },
        locale: 'en',
      });
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should return 400 when endpoint missing', async () => {
      mockRequest.body = {
        subscription: {
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
      };

      await pushController.subscribe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPushRepo.save).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('endpoint'),
        })
      );
    });

    it('should return 400 when keys.p256dh missing', async () => {
      mockRequest.body = {
        subscription: {
          endpoint: 'https://push.example.com/1',
          keys: { auth: 'auth1' },
        },
      };

      await pushController.subscribe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPushRepo.save).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 400 when keys.auth missing', async () => {
      mockRequest.body = {
        subscription: {
          endpoint: 'https://push.example.com/1',
          keys: { p256dh: 'key1' },
        },
      };

      await pushController.subscribe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPushRepo.save).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 401 when unauthenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = {
        subscription: {
          endpoint: 'https://push.example.com/1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
      };

      await pushController.subscribe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPushRepo.save).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('unsubscribe', () => {
    it('should return 204 and delete when endpoint provided', async () => {
      mockRequest.body = { endpoint: 'https://push.example.com/1' };

      await pushController.unsubscribe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPushRepo.deleteByUserAndEndpoint).toHaveBeenCalledWith(
        'user1',
        'https://push.example.com/1'
      );
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should return 400 when endpoint missing', async () => {
      mockRequest.body = {};

      await pushController.unsubscribe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPushRepo.deleteByUserAndEndpoint).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'endpoint is required' });
    });

    it('should return 401 when unauthenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = { endpoint: 'https://push.example.com/1' };

      await pushController.unsubscribe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPushRepo.deleteByUserAndEndpoint).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(401);
    });
  });

  describe('getVapidPublic', () => {
    it('should return publicKey when VAPID_PUBLIC_KEY is set', () => {
      process.env.VAPID_PUBLIC_KEY = 'test-public-key';

      pushController.getVapidPublic(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({ publicKey: 'test-public-key' });
    });

    it('should return 503 when VAPID_PUBLIC_KEY not set', () => {
      process.env.VAPID_PUBLIC_KEY = '';

      pushController.getVapidPublic(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Push notifications not configured',
      });
    });

    it('should return 401 when unauthenticated', () => {
      mockRequest.user = undefined;

      pushController.getVapidPublic(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });
});
