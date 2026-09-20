import { EmailVerificationCode } from '@/domain/models/EmailVerificationCode';

describe('EmailVerificationCode', () => {
  const validId = 'evc-123';
  const validUserId = 'user-456';
  const validCodeHash = 'hash-abc';
  const futureDate = new Date(Date.now() + 60 * 60 * 1000);
  const pastDate = new Date(Date.now() - 60 * 60 * 1000);

  it('should construct with valid arguments', () => {
    const code = new EmailVerificationCode(
      validId,
      validUserId,
      validCodeHash,
      futureDate
    );
    expect(code.id).toBe(validId);
    expect(code.userId).toBe(validUserId);
    expect(code.codeHash).toBe(validCodeHash);
    expect(code.expiresAt).toBe(futureDate);
    expect(code.createdAt).toBeInstanceOf(Date);
  });

  it('should construct with explicit createdAt', () => {
    const createdAt = new Date('2024-01-15T12:00:00Z');
    const code = new EmailVerificationCode(
      validId,
      validUserId,
      validCodeHash,
      futureDate,
      createdAt
    );
    expect(code.createdAt).toBe(createdAt);
  });

  it('isExpired should return false when expiresAt is in the future', () => {
    const code = new EmailVerificationCode(
      validId,
      validUserId,
      validCodeHash,
      futureDate
    );
    expect(code.isExpired()).toBe(false);
  });

  it('isExpired should return true when expiresAt is in the past', () => {
    const code = new EmailVerificationCode(
      validId,
      validUserId,
      validCodeHash,
      pastDate
    );
    expect(code.isExpired()).toBe(true);
  });

  it('should throw when id is empty', () => {
    expect(
      () =>
        new EmailVerificationCode('', validUserId, validCodeHash, futureDate)
    ).toThrow('Verification code ID is required');
    expect(
      () =>
        new EmailVerificationCode('   ', validUserId, validCodeHash, futureDate)
    ).toThrow('Verification code ID is required');
  });

  it('should throw when userId is empty', () => {
    expect(
      () =>
        new EmailVerificationCode(validId, '', validCodeHash, futureDate)
    ).toThrow('User ID is required');
    expect(
      () =>
        new EmailVerificationCode(validId, '   ', validCodeHash, futureDate)
    ).toThrow('User ID is required');
  });

  it('should throw when codeHash is empty', () => {
    expect(
      () =>
        new EmailVerificationCode(validId, validUserId, '', futureDate)
    ).toThrow('Code hash is required');
    expect(
      () =>
        new EmailVerificationCode(validId, validUserId, '   ', futureDate)
    ).toThrow('Code hash is required');
  });

  it('should throw when expiresAt is invalid', () => {
    expect(
      () =>
        new EmailVerificationCode(
          validId,
          validUserId,
          validCodeHash,
          null as unknown as Date
        )
    ).toThrow('Valid expiration date is required');
    expect(
      () =>
        new EmailVerificationCode(
          validId,
          validUserId,
          validCodeHash,
          undefined as unknown as Date
        )
    ).toThrow('Valid expiration date is required');
  });
});
