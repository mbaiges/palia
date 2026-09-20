import { ConsoleEmailSender } from '@/infrastructure/adapters/email/ConsoleEmailSender';
import { logger } from '@/domain/utils/logger';

jest.mock('@/domain/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ConsoleEmailSender', () => {
  let sender: ConsoleEmailSender;

  beforeEach(() => {
    jest.clearAllMocks();
    sender = new ConsoleEmailSender();
  });

  describe('sendVerificationCode', () => {
    it('should log verification code and verify URL', async () => {
      await sender.sendVerificationCode('user@example.com', '123456');

      expect(logger.info).toHaveBeenCalledTimes(1);
      const call = (logger.info as jest.Mock).mock.calls[0][0];
      expect(call).toContain('user@example.com');
      expect(call).toContain('123456');
      expect(call).toContain('Verify at:');
      expect(call).toContain('/login/email');
      expect(call).toContain('step=verify');
    });
  });

  describe('sendPasswordReset', () => {
    it('should log reset URL', async () => {
      await sender.sendPasswordReset(
        'user@example.com',
        'https://app.example.com/reset?token=abc123'
      );

      expect(logger.info).toHaveBeenCalledTimes(1);
      const call = (logger.info as jest.Mock).mock.calls[0][0];
      expect(call).toContain('user@example.com');
      expect(call).toContain('Reset at:');
      expect(call).toContain('https://app.example.com/reset?token=abc123');
    });
  });
});
