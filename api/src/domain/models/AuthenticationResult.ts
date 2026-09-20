import { AuthAccount } from '@/domain/models/AuthAccount';

export interface AuthenticationResult {
  account: AuthAccount;
  accessToken: string;
  refreshToken?: string;
  scopes?: string[];
}
