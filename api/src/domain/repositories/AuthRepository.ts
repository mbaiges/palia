import { AuthAccount } from '@/domain/models/AuthAccount';
import { AuthenticationResult } from '@/domain/models/AuthenticationResult';

export interface AuthRepository {
  refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; expiryDate: number }>;

  authenticateWithCode(code: string): Promise<AuthenticationResult>;

  verifyToken(token: string): Promise<AuthAccount>;
}
