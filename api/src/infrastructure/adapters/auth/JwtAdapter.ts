import * as jwt from 'jsonwebtoken';
import { User } from '@/domain/models/User';
import { TokenProvider } from '@/domain/repositories/TokenProvider';
import { TokenPayload } from '@/domain/models/TokenPayload';

/**
 * JWT Adapter
 * Infrastructure adapter for JWT token operations
 */
export class JwtAdapter implements TokenProvider {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor(
    jwtSecret: string = process.env.JWT_SECRET ||
      'your-secret-key-change-in-production',
    jwtExpiresIn: string = '7d'
  ) {
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  /**
   * Generate JWT token for user
   */
  generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      googleId: user.googleId ?? null,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'financiate-api',
      subject: user.id,
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token and return payload
   */
  verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'financiate-api',
      }) as any;

      return {
        userId: decoded.userId,
        email: decoded.email,
        googleId: decoded.googleId ?? null,
      };
    } catch (error: any) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }
}
