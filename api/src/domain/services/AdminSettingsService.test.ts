import { AdminSettingsService } from './AdminSettingsService';
import { AppSettingsRepository } from '@/domain/repositories/AppSettingsRepository';

describe('AdminSettingsService', () => {
  let adminSettingsService: AdminSettingsService;
  let mockAppSettingsRepository: jest.Mocked<AppSettingsRepository>;

  beforeEach(() => {
    mockAppSettingsRepository = {
      getAllowedUsers: jest.fn(),
      addAllowedUser: jest.fn(),
      removeAllowedUser: jest.fn(),
      isEmailAllowed: jest.fn(),
    };

    adminSettingsService = new AdminSettingsService(mockAppSettingsRepository);
  });

  describe('getAllowedUsers', () => {
    it('should return all allowed users', async () => {
      const mockUsers = ['user1@example.com', 'user2@example.com'];
      mockAppSettingsRepository.getAllowedUsers.mockResolvedValue(mockUsers);

      const result = await adminSettingsService.getAllowedUsers();

      expect(result).toEqual(mockUsers);
      expect(mockAppSettingsRepository.getAllowedUsers).toHaveBeenCalled();
    });
  });

  describe('addAllowedUser', () => {
    it('should add a valid email', async () => {
      const email = 'newuser@example.com';
      mockAppSettingsRepository.isEmailAllowed.mockResolvedValue(false);
      mockAppSettingsRepository.addAllowedUser.mockResolvedValue();

      await adminSettingsService.addAllowedUser(email);

      expect(mockAppSettingsRepository.isEmailAllowed).toHaveBeenCalledWith(email);
      expect(mockAppSettingsRepository.addAllowedUser).toHaveBeenCalledWith(email);
    });

    it('should throw error for invalid email format', async () => {
      const email = 'invalid-email';

      await expect(adminSettingsService.addAllowedUser(email)).rejects.toThrow(
        'Invalid email format'
      );
      expect(mockAppSettingsRepository.addAllowedUser).not.toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const email = 'existing@example.com';
      mockAppSettingsRepository.isEmailAllowed.mockResolvedValue(true);

      await expect(adminSettingsService.addAllowedUser(email)).rejects.toThrow(
        'Email is already in the allowed users list'
      );
      expect(mockAppSettingsRepository.addAllowedUser).not.toHaveBeenCalled();
    });
  });

  describe('removeAllowedUser', () => {
    it('should remove an existing email', async () => {
      const email = 'user@example.com';
      mockAppSettingsRepository.isEmailAllowed.mockResolvedValue(true);
      mockAppSettingsRepository.removeAllowedUser.mockResolvedValue();

      await adminSettingsService.removeAllowedUser(email);

      expect(mockAppSettingsRepository.isEmailAllowed).toHaveBeenCalledWith(email);
      expect(mockAppSettingsRepository.removeAllowedUser).toHaveBeenCalledWith(email);
    });

    it('should throw error for invalid email format', async () => {
      const email = 'invalid-email';

      await expect(adminSettingsService.removeAllowedUser(email)).rejects.toThrow(
        'Invalid email format'
      );
      expect(mockAppSettingsRepository.removeAllowedUser).not.toHaveBeenCalled();
    });

    it('should throw error if email does not exist', async () => {
      const email = 'nonexistent@example.com';
      mockAppSettingsRepository.isEmailAllowed.mockResolvedValue(false);

      await expect(adminSettingsService.removeAllowedUser(email)).rejects.toThrow(
        'Email is not in the allowed users list'
      );
      expect(mockAppSettingsRepository.removeAllowedUser).not.toHaveBeenCalled();
    });
  });
});

