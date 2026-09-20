import { OAuth2Client } from 'google-auth-library';
import { injectable } from 'tsyringe';
import { AuthRepository } from '@/domain/repositories/AuthRepository';
import { configService } from '@/infrastructure/config/config';
import { AuthAccount } from '@/domain/models/AuthAccount';
import { AuthenticationResult } from '@/domain/models/AuthenticationResult';

/**
 * Google OAuth Adapter
 * Infrastructure adapter for Google OAuth verification
 */
@injectable()
export class GoogleAuthRepository implements AuthRepository {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(
      configService.config.googleClientId,
      configService.config.googleClientSecret,
      'postmessage'
    );
  }

  /**
   * Exchange authorization code for tokens and extract user information
   */
  async authenticateWithCode(code: string): Promise<AuthenticationResult> {
    try {
      const { tokens } = await this.googleClient.getToken(code);
      this.googleClient.setCredentials(tokens);

      if (!tokens.id_token || !tokens.access_token) {
        throw new Error('ID token or access token not found in Google response');
      }

      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID || '',
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('No payload found in Google ID token');
      }

      const { sub: googleId, email, name, picture } = payload;

      if (!email || !name || !googleId) {
        throw new Error('Email, name, and Google ID are required from Google');
      }

      return {
        account: {
          provider: 'google',
          providerId: googleId,
          email,
          name,
          picture: picture || undefined,
        },
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        scopes: tokens.scope?.split(' ') || [],
      };
    } catch (error: any) {
      throw new Error(`Failed to get user info from Google: ${error.message}`);
    }
  }

  /**
   * Refresh Google access token using a refresh token
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; expiryDate: number }> {
    try {
      this.googleClient.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.googleClient.refreshAccessToken();
      if (!credentials.access_token || !credentials.expiry_date) {
        throw new Error('Failed to refresh access token');
      }
      return {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date,
      };
    } catch (error: any) {
      throw new Error(`Failed to refresh Google access token: ${error.message}`);
    }
  }

  async verifyToken(token: string): Promise<AuthAccount> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: configService.config.googleClientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('No payload found in Google ID token');
      }

      const { sub: googleId, email, name, picture } = payload;

      if (!googleId || !email || !name) {
        throw new Error('googleId, email and name are required from Google');
      }

      return {
        provider: 'google',
        providerId: googleId,
        email,
        name,
        picture: picture || undefined,
      };
    } catch (error: any) {
      throw new Error(`Failed to verify token with Google: ${error.message}`);
    }
  }
}
