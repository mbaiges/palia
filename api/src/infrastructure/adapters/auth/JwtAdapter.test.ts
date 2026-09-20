import { JwtAdapter } from '@/infrastructure/adapters/auth/JwtAdapter';
import { User } from '@/domain/models/User';

describe('JwtAdapter', () => {
  const secret = 'test-secret-key';
  const expiresIn = '1h';
  let adapter: JwtAdapter;
  let testUser: User;

  beforeEach(() => {
    adapter = new JwtAdapter(secret, expiresIn);
    testUser = new User('user-123', 'google-456', 'test@example.com', 'Test User');
  });

  describe('generateToken', () => {
    it('should return a non-empty JWT string', () => {
      const token = adapter.generateToken(testUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should decode valid token and return correct payload', () => {
      const token = adapter.generateToken(testUser);
      const payload = adapter.verifyToken(token);

      expect(payload.userId).toBe('user-123');
      expect(payload.email).toBe('test@example.com');
      expect(payload.googleId).toBe('google-456');
    });

    it('should handle user with null googleId', () => {
      const emailOnlyUser = new User(
        'user-789',
        null,
        'email@example.com',
        'Email User'
      );
      const token = adapter.generateToken(emailOnlyUser);
      const payload = adapter.verifyToken(token);

      expect(payload.userId).toBe('user-789');
      expect(payload.email).toBe('email@example.com');
      expect(payload.googleId).toBeNull();
    });

    it('should throw for invalid token', () => {
      expect(() => adapter.verifyToken('invalid-token')).toThrow(/Token verification failed/);
    });

    it('should throw for tampered token', () => {
      const token = adapter.generateToken(testUser);
      const tampered = token.slice(0, -5) + 'xxxxx';
      expect(() => adapter.verifyToken(tampered)).toThrow(/Token verification failed/);
    });
  });
});
