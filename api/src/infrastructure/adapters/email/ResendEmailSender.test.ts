import { ResendEmailSender } from '@/infrastructure/adapters/email/ResendEmailSender';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

describe('ResendEmailSender', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: 'msg-1' }, error: null });
  });

  describe('sendVerificationCode', () => {
    it('should call resend.emails.send with correct params', async () => {
      const sender = new ResendEmailSender('test-api-key', 'Test <test@example.com>');
      await sender.sendVerificationCode('user@example.com', '123456');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.from).toBe('Test <test@example.com>');
      expect(call.to).toEqual(['user@example.com']);
      expect(call.subject).toBe('Verify your account');
      expect(call.react).toBeDefined();
    });

    it('should use custom subject when provided', async () => {
      const sender = new ResendEmailSender('test-api-key', 'Test <test@example.com>');
      await sender.sendVerificationCode('user@example.com', '123456', 'Custom subject');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Custom subject',
        })
      );
    });

    it('should throw when Resend returns error', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded' },
      });

      const sender = new ResendEmailSender('test-api-key');
      await expect(sender.sendVerificationCode('user@example.com', '123456')).rejects.toThrow(
        'Failed to send verification email: Rate limit exceeded'
      );
    });
  });

  describe('sendPasswordReset', () => {
    it('should call resend.emails.send with correct params', async () => {
      const sender = new ResendEmailSender('test-api-key', 'Test <test@example.com>');
      await sender.sendPasswordReset(
        'user@example.com',
        'https://app.example.com/reset?token=abc'
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.from).toBe('Test <test@example.com>');
      expect(call.to).toEqual(['user@example.com']);
      expect(call.subject).toBe('Reset your password');
      expect(call.react).toBeDefined();
    });

    it('should use custom subject when provided', async () => {
      const sender = new ResendEmailSender('test-api-key', 'Test <test@example.com>');
      await sender.sendPasswordReset(
        'user@example.com',
        'https://app.example.com/reset',
        'Custom reset subject'
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Custom reset subject',
        })
      );
    });

    it('should throw when Resend returns error', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API key' },
      });

      const sender = new ResendEmailSender('test-api-key');
      await expect(
        sender.sendPasswordReset('user@example.com', 'https://app.example.com/reset')
      ).rejects.toThrow('Failed to send password reset email: Invalid API key');
    });
  });
});
