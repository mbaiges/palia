import 'reflect-metadata';
import { AdminSettingsController } from '@/infrastructure/controllers/AdminSettingsController';
import { AdminSettingsHandler } from '@/application/handlers/AdminSettingsHandler';
import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';
import { Request, Response } from 'express';

jest.mock('@/application/handlers/AdminSettingsHandler');
jest.mock('@/domain/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('AdminSettingsController', () => {
  let adminSettingsController: AdminSettingsController;
  let mockAdminSettingsHandler: jest.Mocked<AdminSettingsHandler>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    mockAdminSettingsHandler = new (AdminSettingsHandler as any)() as jest.Mocked<AdminSettingsHandler>;
    adminSettingsController = new AdminSettingsController(mockAdminSettingsHandler);
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllowedUsers', () => {
    it('should return 200 with allowed users list', async () => {
      // Arrange
      const mockUsers = ['user1@example.com', 'user2@example.com'];
      mockAdminSettingsHandler.getAllowedUsers.mockResolvedValue(mockUsers);

      // Act
      await adminSettingsController.getAllowedUsers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAdminSettingsHandler.getAllowedUsers).toHaveBeenCalledTimes(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          allowedUsers: mockUsers,
        },
      });
    });

    it('should return 500 on error', async () => {
      // Arrange
      const error = new Error('Database error');
      mockAdminSettingsHandler.getAllowedUsers.mockRejectedValue(error);

      // Act
      await adminSettingsController.getAllowedUsers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Database error',
      });
    });
  });

  describe('addAllowedUser', () => {
    it('should return 201 when user is added successfully', async () => {
      // Arrange
      mockRequest = { body: { email: 'newuser@example.com' } };
      mockAdminSettingsHandler.addAllowedUser.mockResolvedValue();

      // Act
      await adminSettingsController.addAllowedUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAdminSettingsHandler.addAllowedUser).toHaveBeenCalledWith('newuser@example.com');
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Allowed user added successfully',
      });
    });

    it('should return 400 when email is missing', async () => {
      // Arrange
      mockRequest = { body: {} };

      // Act
      await adminSettingsController.addAllowedUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Email is required',
      });
      expect(mockAdminSettingsHandler.addAllowedUser).not.toHaveBeenCalled();
    });

    it('should return 400 when email is not a string', async () => {
      // Arrange
      mockRequest = { body: { email: 123 } };

      // Act
      await adminSettingsController.addAllowedUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Email is required',
      });
    });

    it('should return 409 when email already exists', async () => {
      // Arrange
      mockRequest = { body: { email: 'existing@example.com' } };
      const error = new AppError('Email is already in the allowed users list', ErrorCode.ADMIN_EMAIL_ALREADY_ALLOWED);
      mockAdminSettingsHandler.addAllowedUser.mockRejectedValue(error);

      // Act
      await adminSettingsController.addAllowedUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Email is already in the allowed users list',
        errorCode: ErrorCode.ADMIN_EMAIL_ALREADY_ALLOWED,
      });
    });

    it('should return 400 when email format is invalid', async () => {
      // Arrange
      mockRequest = { body: { email: 'invalid-email' } };
      const error = new AppError('Invalid email format', ErrorCode.ADMIN_INVALID_EMAIL);
      mockAdminSettingsHandler.addAllowedUser.mockRejectedValue(error);

      // Act
      await adminSettingsController.addAllowedUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid email format',
        errorCode: ErrorCode.ADMIN_INVALID_EMAIL,
      });
    });

    it('should return 500 on unexpected error', async () => {
      // Arrange
      mockRequest = { body: { email: 'user@example.com' } };
      const error = new Error('Unexpected error');
      mockAdminSettingsHandler.addAllowedUser.mockRejectedValue(error);

      // Act
      await adminSettingsController.addAllowedUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Unexpected error',
      });
    });
  });

  describe('removeAllowedUser', () => {
    it('should return 200 when user is removed successfully', async () => {
      // Arrange
      mockRequest = { params: { email: 'user@example.com' } };
      mockAdminSettingsHandler.removeAllowedUser.mockResolvedValue();

      // Act
      await adminSettingsController.removeAllowedUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAdminSettingsHandler.removeAllowedUser).toHaveBeenCalledWith('user@example.com');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Allowed user removed successfully',
      });
    });

    it('should decode URL-encoded email', async () => {
      // Arrange
      const encodedEmail = encodeURIComponent('user+test@example.com');
      mockRequest = { params: { email: encodedEmail } };
      mockAdminSettingsHandler.removeAllowedUser.mockResolvedValue();

      // Act
      await adminSettingsController.removeAllowedUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAdminSettingsHandler.removeAllowedUser).toHaveBeenCalledWith('user+test@example.com');
    });

    it('should return 400 when email is missing', async () => {
      // Arrange
      mockRequest = { params: {} };

      // Act
      await adminSettingsController.removeAllowedUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Email is required',
      });
      expect(mockAdminSettingsHandler.removeAllowedUser).not.toHaveBeenCalled();
    });

    it('should return 404 when email does not exist', async () => {
      // Arrange
      mockRequest = { params: { email: 'nonexistent@example.com' } };
      const error = new AppError('Email is not in the allowed users list', ErrorCode.ADMIN_EMAIL_NOT_ALLOWED);
      mockAdminSettingsHandler.removeAllowedUser.mockRejectedValue(error);

      // Act
      await adminSettingsController.removeAllowedUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Email is not in the allowed users list',
        errorCode: ErrorCode.ADMIN_EMAIL_NOT_ALLOWED,
      });
    });

    it('should return 400 when email format is invalid', async () => {
      // Arrange
      mockRequest = { params: { email: 'invalid-email' } };
      const error = new AppError('Invalid email format', ErrorCode.ADMIN_INVALID_EMAIL);
      mockAdminSettingsHandler.removeAllowedUser.mockRejectedValue(error);

      // Act
      await adminSettingsController.removeAllowedUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid email format',
        errorCode: ErrorCode.ADMIN_INVALID_EMAIL,
      });
    });

    it('should return 500 on unexpected error', async () => {
      // Arrange
      mockRequest = { params: { email: 'user@example.com' } };
      const error = new Error('Unexpected error');
      mockAdminSettingsHandler.removeAllowedUser.mockRejectedValue(error);

      // Act
      await adminSettingsController.removeAllowedUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Unexpected error',
      });
    });
  });
});

