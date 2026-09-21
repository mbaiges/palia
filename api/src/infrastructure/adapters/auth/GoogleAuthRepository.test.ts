import { OAuth2Client } from 'google-auth-library';
import { GoogleAuthRepository } from './GoogleAuthRepository';
import { configService } from '@/infrastructure/config/config';

describe('GoogleAuthRepository', () => {
  const getToken = jest.spyOn(OAuth2Client.prototype, 'getToken');
  const verifyIdToken = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
  const repository = new GoogleAuthRepository();

  beforeEach(() => {
    jest.clearAllMocks();
    getToken.mockResolvedValue({
      tokens: {
        id_token: 'google-id-token',
        access_token: 'google-access-token',
        scope: 'openid email profile',
      },
      res: undefined,
    } as never);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('verifies against the configured client id and returns only verified, normalized email', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-user-1',
        email: '  Volunteer@Example.com ',
        email_verified: true,
        name: 'Volunteer',
      }),
    } as never);

    const result = await repository.authenticateWithCode('auth-code');

    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: 'google-id-token',
      audience: configService.config.googleClientId,
    });
    expect(result.account.email).toBe('volunteer@example.com');
  });

  it('rejects Google identities without a verified email', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-user-1',
        email: 'volunteer@example.com',
        email_verified: false,
        name: 'Volunteer',
      }),
    } as never);

    await expect(repository.authenticateWithCode('auth-code')).rejects.toThrow(
      'Failed to get user info from Google'
    );
  });

  it('does not accept test identity codes outside NODE_ENV=test', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousFakeMode = process.env.TEST_GOOGLE_AUTH;
    process.env.NODE_ENV = 'production';
    process.env.TEST_GOOGLE_AUTH = 'true';
    getToken.mockRejectedValueOnce(
      new Error('real Google exchange attempted') as never
    );

    try {
      await expect(
        repository.authenticateWithCode(
          'test-google:eyJlbWFpbCI6IngiLCJuYW1lIjoieCIsInN1YiI6IngifQ'
        )
      ).rejects.toThrow('real Google exchange attempted');
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
      if (previousFakeMode === undefined) delete process.env.TEST_GOOGLE_AUTH;
      else process.env.TEST_GOOGLE_AUTH = previousFakeMode;
    }
  });
});
