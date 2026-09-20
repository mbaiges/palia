import 'reflect-metadata';
import { NotificationController } from '@/infrastructure/controllers/NotificationController';
import type { GenericNotificationService } from '@/infrastructure/services/GenericNotificationService';
import { Request, Response } from 'express';
import { AuthenticatedUser } from '@/domain/models/AuthenticatedUser';

const mockUser = new AuthenticatedUser(
  'user1',
  'google-1',
  'test@test.com',
  'Test User'
);

describe('NotificationController', () => {
  let notificationController: NotificationController;
  let mockNotificationService: jest.Mocked<GenericNotificationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    mockNotificationService = {
      getMyNotifications: jest.fn(),
    } as any;
    notificationController = new NotificationController(mockNotificationService);
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
    mockRequest = {
      user: mockUser,
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyNotifications', () => {
    it('should return notifications when authenticated', async () => {
      const notifications = [
        {
          type: 'example' as const,
          id: 'notification-1',
          title: 'Example notification',
          body: 'A generic notification fixture',
          createdAt: '2024-01-01T10:00:00Z',
          read: false,
        },
      ];
      mockNotificationService.getMyNotifications.mockResolvedValue(notifications);

      await notificationController.getMyNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockNotificationService.getMyNotifications).toHaveBeenCalledWith(
        'user1'
      );
      expect(mockJson).toHaveBeenCalledWith({ notifications });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest = { user: undefined } as any;

      await notificationController.getMyNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockNotificationService.getMyNotifications).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 500 when service throws', async () => {
      mockNotificationService.getMyNotifications.mockRejectedValue(new Error('DB error'));

      await notificationController.getMyNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'DB error' });
    });
  });
});
