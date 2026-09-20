import 'reflect-metadata';
import { AdminSettingsHandler } from '@/application/handlers/AdminSettingsHandler';
import { AdminSettingsService } from '@/domain/services/AdminSettingsService';

describe('AdminSettingsHandler', () => {
  let adminSettingsHandler: AdminSettingsHandler;
  let mockAdminSettingsService: jest.Mocked<AdminSettingsService>;

  beforeEach(() => {
    mockAdminSettingsService = {
      getAllowedUsers: jest.fn(),
      addAllowedUser: jest.fn(),
      removeAllowedUser: jest.fn(),
    } as any;

    adminSettingsHandler = new AdminSettingsHandler(mockAdminSettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllowedUsers', () => {
    it('should return all allowed users from service', async () => {
      // Arrange
      const mockUsers = ['user1@example.com', 'user2@example.com'];
      mockAdminSettingsService.getAllowedUsers.mockResolvedValue(mockUsers);

      // Act
      const result = await adminSettingsHandler.getAllowedUsers();

      // Assert
      expect(result).toEqual(mockUsers);
      expect(mockAdminSettingsService.getAllowedUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('addAllowedUser', () => {
    it('should add an allowed user via service', async () => {
      // Arrange
      const email = 'newuser@example.com';
      mockAdminSettingsService.addAllowedUser.mockResolvedValue();

      // Act
      await adminSettingsHandler.addAllowedUser(email);

      // Assert
      expect(mockAdminSettingsService.addAllowedUser).toHaveBeenCalledWith(email);
      expect(mockAdminSettingsService.addAllowedUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeAllowedUser', () => {
    it('should remove an allowed user via service', async () => {
      // Arrange
      const email = 'user@example.com';
      mockAdminSettingsService.removeAllowedUser.mockResolvedValue();

      // Act
      await adminSettingsHandler.removeAllowedUser(email);

      // Assert
      expect(mockAdminSettingsService.removeAllowedUser).toHaveBeenCalledWith(email);
      expect(mockAdminSettingsService.removeAllowedUser).toHaveBeenCalledTimes(1);
    });
  });
});

