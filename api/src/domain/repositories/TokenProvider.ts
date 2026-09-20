import { User } from '@/domain/models/User';
import { TokenPayload } from '@/domain/models/TokenPayload';

export interface TokenProvider {
  generateToken(user: User): string;
  verifyToken(token: string): TokenPayload;
}
