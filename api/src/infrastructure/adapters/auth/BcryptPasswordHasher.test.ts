import { BcryptPasswordHasher } from '@/infrastructure/adapters/auth/BcryptPasswordHasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  describe('hash', () => {
    it('should return a non-empty hash different from input', async () => {
      const password = 'secret123';
      const hash = await hasher.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should produce different hashes for same password (salt)', async () => {
      const password = 'secret123';
      const hash1 = await hasher.hash(password);
      const hash2 = await hasher.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verify', () => {
    it('should return true for correct password', async () => {
      const password = 'secret123';
      const hash = await hasher.hash(password);

      const result = await hasher.verify(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const password = 'secret123';
      const hash = await hasher.hash(password);

      const result = await hasher.verify('wrongpassword', hash);
      expect(result).toBe(false);
    });

    it('should return false for empty or invalid hash', async () => {
      const result = await hasher.verify('secret123', '');
      expect(result).toBe(false);
    });
  });
});
