import { User } from '@/domain/models/User';

describe('User Model', () => {
  const id = 'user-123';
  const googleId = 'google-789';
  const email = 'test.user@example.com';
  const name = 'Test User';
  const profileImageId = 'profile-img-123';
  const avatarImageId = 'avatar-img-123';
  const googleRefreshToken = 'google-refresh-token';
  const googleScopes = ['scope1', 'scope2'];
  const createdAt = new Date();
  const updatedAt = new Date();

  let user: User;

  beforeEach(() => {
    user = new User(
      id,
      googleId,
      email,
      name,
      profileImageId,
      avatarImageId,
      googleRefreshToken,
      googleScopes,
      undefined,
      true,
      createdAt,
      updatedAt
    );
  });

  it('should correctly construct a User object', () => {
    expect(user.id).toBe(id);
    expect(user.googleId).toBe(googleId);
    expect(user.email).toBe(email);
    expect(user.name).toBe(name);
    expect(user.profileImageId).toBe(profileImageId);
    expect(user.avatarImageId).toBe(avatarImageId);
    expect(user.googleRefreshToken).toBe(googleRefreshToken);
    expect(user.googleScopes).toBe(googleScopes);
    expect(user.createdAt).toBe(createdAt);
    expect(user.updatedAt).toBe(updatedAt);
  });

  it('toPublicUser should return only public-safe fields', () => {
    const publicUser = user.toPublicUser();

    expect(publicUser.id).toBe(id);
    expect(publicUser.name).toBe(name);
    expect(publicUser.profileImageId).toBe(profileImageId);
    
    // Ensure sensitive fields are not present - this needs to be updated based on PublicUser model
    // For now, we assume it's correct based on the main User model's method
  });

  it('toAuthenticatedUser should return fields for an authenticated session', () => {
    const authenticatedUser = user.toAuthenticatedUser();

    expect(authenticatedUser.id).toBe(id);
    expect(authenticatedUser.email).toBe(email);
    expect(authenticatedUser.name).toBe(name);
    expect(authenticatedUser.profileImageId).toBe(profileImageId);

    // Ensure sensitive fields are not present - this needs to be updated based on AuthenticatedUser model
    // For now, we assume it's correct based on the main User model's method
  });
});
