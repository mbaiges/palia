import 'reflect-metadata';
import { SqliteUserRepository } from '@/infrastructure/adapters/repositories/SqliteUserRepository';
import { User } from '@/domain/models/User';
import { PublicUser } from '@/domain/models/PublicUser';
import { DatabaseConfig } from '@/infrastructure/config/database';

jest.mock('@/infrastructure/utils/crypto', () => ({
  encrypt: jest.fn((text: string) => `encrypted:${text}`),
  decrypt: jest.fn((text: string) => text.replace('encrypted:', '')),
}));

describe('SqliteUserRepository', () => {
  let userRepository: SqliteUserRepository;
  const client = DatabaseConfig.getConnection();

  beforeEach(async () => {
    await DatabaseConfig.clean();
    userRepository = new SqliteUserRepository();
  });

  describe('save', () => {
    it('should insert a new user', async () => {
      await client.execute({
        sql: 'INSERT INTO images (image_id, url, created_at) VALUES (?, ?, ?)',
        args: ['profile-img-1', 'http://example.com/img.jpg', new Date().toISOString()],
      });

      const user = new User('1', 'google-1', 'test@test.com', 'Test User', 'profile-img-1', undefined, 'refresh-token', ['scope1']);
      await userRepository.save(user);

      const result = await client.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: ['1'] });
      const row = result.rows[0] as any;
      expect(row).toBeDefined();
      expect(row.name).toBe('Test User');
      expect(row.profile_image_id).toBe('profile-img-1');
      expect(row.google_refresh_token).toBe('encrypted:refresh-token');
    });

    it('should update an existing user', async () => {
      const initialUser = new User('1', 'google-1', 'test@test.com', 'Test User');
      await userRepository.save(initialUser);

      await client.execute({
        sql: 'INSERT INTO images (image_id, url, created_at) VALUES (?, ?, ?)',
        args: ['new-profile-img', 'http://example.com/new.jpg', new Date().toISOString()],
      });

      const updatedUser = new User('1', 'google-1', 'test@test.com', 'Updated User', 'new-profile-img');
      await userRepository.save(updatedUser);

      const result = await client.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: ['1'] });
      const row = result.rows[0] as any;
      expect(row.name).toBe('Updated User');
      expect(row.profile_image_id).toBe('new-profile-img');
    });
  });

  describe('findById', () => {
    it('should find and return a user', async () => {
      const user = new User('1', 'google-1', 'test@test.com', 'Test User', undefined, undefined, 'refresh-token');
      await userRepository.save(user);

      const foundUser = await userRepository.findById('1');
      expect(foundUser).toBeInstanceOf(User);
      expect(foundUser?.id).toBe('1');
      expect(foundUser?.googleRefreshToken).toBe('refresh-token');
    });

    it('should return null if user not found', async () => {
      const foundUser = await userRepository.findById('non-existent');
      expect(foundUser).toBeNull();
    });
  });

  describe('findPublicById', () => {
    it('should find and return a public user', async () => {
      const user = new User('user-public', 'google-public', 'public@test.com', 'Public User');
      await userRepository.save(user);

      const foundUser = await userRepository.findPublicById('user-public');
      expect(foundUser).toBeInstanceOf(PublicUser);
      expect(foundUser?.id).toBe('user-public');
    });
  });

  describe('findByGoogleId', () => {
    it('should find and return a user by google id', async () => {
      const user = new User('1', 'google-1', 'test@test.com', 'Test User');
      await userRepository.save(user);

      const foundUser = await userRepository.findByGoogleId('google-1');
      expect(foundUser).toBeInstanceOf(User);
      expect(foundUser?.googleId).toBe('google-1');
    });
  });

  describe('findByEmail', () => {
    it('should find and return a user by email', async () => {
      const user = new User('1', 'google-1', 'test@test.com', 'Test User');
      await userRepository.save(user);

      const foundUser = await userRepository.findByEmail('test@test.com');
      expect(foundUser).toBeInstanceOf(User);
      expect(foundUser?.email).toBe('test@test.com');
    });
  });

  describe('findPublicAll', () => {
    it('should return an array of all public users', async () => {
      await userRepository.save(new User('1', 'google-1', 'test1@test.com', 'Test1'));
      await userRepository.save(new User('2', 'google-2', 'test2@test.com', 'Test2'));

      const users = await userRepository.findPublicAll();
      expect(users).toHaveLength(2);
      expect(users[0]).toBeInstanceOf(PublicUser);
    });
  });

  describe('delete', () => {
    it('should delete a user and return true', async () => {
      const user = new User('1', 'google-1', 'test@test.com', 'Test User');
      await userRepository.save(user);

      const result = await userRepository.delete('1');
      expect(result).toBe(true);

      const selectResult = await client.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: ['1'] });
      expect(selectResult.rows.length).toBe(0);
    });

    it('should return false if user to delete is not found', async () => {
      const result = await userRepository.delete('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('searchUsers', () => {
    it('should return paginated users without search query', async () => {
      await userRepository.save(new User('1', 'google-1', 'user1@test.com', 'User 1'));
      await userRepository.save(new User('2', 'google-2', 'user2@test.com', 'User 2'));
      await userRepository.save(new User('3', 'google-3', 'user3@test.com', 'User 3'));

      const result = await userRepository.searchUsers({ page: 1, limit: 2 });
      expect(result.items).toHaveLength(2);
      expect(result.totalItems).toBe(3);
      expect(result.itemsPerPage).toBe(2);
      expect(result.totalPages).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.items[0]).toBeInstanceOf(PublicUser);
    });

    it('should return paginated users with search query matching email', async () => {
      await userRepository.save(new User('1', 'google-1', 'john@test.com', 'John Doe'));
      await userRepository.save(new User('2', 'google-2', 'jane@test.com', 'Jane Doe'));
      await userRepository.save(new User('3', 'google-3', 'bob@test.com', 'Bob Smith'));

      const result = await userRepository.searchUsers({ page: 1, limit: 10, searchQuery: 'john' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].email).toBe('john@test.com');
      expect(result.totalItems).toBe(1);
    });

    it('should return paginated users with search query matching name', async () => {
      await userRepository.save(new User('1', 'google-1', 'user1@test.com', 'John Doe'));
      await userRepository.save(new User('2', 'google-2', 'user2@test.com', 'Jane Doe'));
      await userRepository.save(new User('3', 'google-3', 'user3@test.com', 'Bob Smith'));

      const result = await userRepository.searchUsers({ page: 1, limit: 10, searchQuery: 'Jane' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Jane Doe');
      expect(result.totalItems).toBe(1);
    });

    it('should handle pagination correctly', async () => {
      await userRepository.save(new User('1', 'google-1', 'user1@test.com', 'User 1'));
      await userRepository.save(new User('2', 'google-2', 'user2@test.com', 'User 2'));
      await userRepository.save(new User('3', 'google-3', 'user3@test.com', 'User 3'));

      const page1 = await userRepository.searchUsers({ page: 1, limit: 2 });
      const page2 = await userRepository.searchUsers({ page: 2, limit: 2 });

      expect(page1.items).toHaveLength(2);
      expect(page1.currentPage).toBe(1);
      expect(page2.items).toHaveLength(1);
      expect(page2.currentPage).toBe(2);
      expect(page1.items[0].email).not.toBe(page2.items[0].email);
    });

    it('should return empty result when no users match search query', async () => {
      await userRepository.save(new User('1', 'google-1', 'user1@test.com', 'User 1'));

      const result = await userRepository.searchUsers({ page: 1, limit: 10, searchQuery: 'nonexistent' });
      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('countUsers', () => {
    it('should return total count of all users when no search query', async () => {
      await userRepository.save(new User('1', 'google-1', 'user1@test.com', 'User 1'));
      await userRepository.save(new User('2', 'google-2', 'user2@test.com', 'User 2'));

      const count = await userRepository.countUsers();
      expect(count).toBe(2);
    });

    it('should return count of users matching search query by email', async () => {
      await userRepository.save(new User('1', 'google-1', 'john@test.com', 'John Doe'));
      await userRepository.save(new User('2', 'google-2', 'jane@test.com', 'Jane Doe'));
      await userRepository.save(new User('3', 'google-3', 'bob@test.com', 'Bob Smith'));

      const count = await userRepository.countUsers('john');
      expect(count).toBe(1);
    });

    it('should return count of users matching search query by name', async () => {
      await userRepository.save(new User('1', 'google-1', 'user1@test.com', 'John Doe'));
      await userRepository.save(new User('2', 'google-2', 'user2@test.com', 'Jane Doe'));
      await userRepository.save(new User('3', 'google-3', 'user3@test.com', 'Bob Smith'));

      const count = await userRepository.countUsers('Doe');
      expect(count).toBe(2);
    });

    it('should return 0 when no users match search query', async () => {
      await userRepository.save(new User('1', 'google-1', 'user1@test.com', 'User 1'));

      const count = await userRepository.countUsers('nonexistent');
      expect(count).toBe(0);
    });
  });

  describe('searchUsersWithRolesAndAllowed', () => {
    it('should return paginated registered users with roles and allowed status', async () => {
      const now = new Date().toISOString();
      await userRepository.save(new User('1', 'google-1', 'user1@test.com', 'User 1'));
      await userRepository.save(new User('2', 'google-2', 'user2@test.com', 'User 2'));

      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['admin', 'Admin'] });
      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });
      await userRepository.assignRole('1', 'admin');
      await userRepository.assignRole('2', 'user');
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['user1@test.com', now],
      });
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['user2@test.com', now],
      });

      const result = await userRepository.searchUsersWithRolesAndAllowed({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(2);
      expect(result.totalItems).toBe(2);
      expect(result.items[0].email).toBe('user1@test.com');
      expect(result.items[0].isRegistered).toBe(true);
      expect(result.items[0].isAllowed).toBe(true);
      expect(result.items[0].roleIds).toContain('admin');
      expect(result.items[1].email).toBe('user2@test.com');
      expect(result.items[1].isRegistered).toBe(true);
      expect(result.items[1].isAllowed).toBe(true);
      expect(result.items[1].roleIds).toContain('user');
    });

    it('should include unregistered allowed users when includeAllowedUsers is true', async () => {
      const now = new Date().toISOString();
      await userRepository.save(new User('1', 'google-1', 'registered@test.com', 'Registered User'));

      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });
      await userRepository.assignRole('1', 'user');
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['registered@test.com', now],
      });
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['unregistered@test.com', now],
      });

      const result = await userRepository.searchUsersWithRolesAndAllowed({
        page: 1,
        limit: 10,
        includeAllowedUsers: true,
      });

      expect(result.items.length).toBeGreaterThanOrEqual(2);
      const registeredUser = result.items.find((u) => u.email === 'registered@test.com');
      const unregisteredUser = result.items.find((u) => u.email === 'unregistered@test.com');
      expect(registeredUser).toBeDefined();
      expect(registeredUser!.isRegistered).toBe(true);
      expect(unregisteredUser).toBeDefined();
      expect(unregisteredUser!.isRegistered).toBe(false);
      expect(unregisteredUser!.isAllowed).toBe(true);
      expect(unregisteredUser!.roleIds).toEqual(['user']);
    });

    it('should filter registered users by email search query', async () => {
      const now = new Date().toISOString();
      await userRepository.save(new User('1', 'google-1', 'john@test.com', 'John Doe'));
      await userRepository.save(new User('2', 'google-2', 'jane@test.com', 'Jane Doe'));

      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });
      await userRepository.assignRole('1', 'user');
      await userRepository.assignRole('2', 'user');
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['john@test.com', now],
      });
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['jane@test.com', now],
      });

      const result = await userRepository.searchUsersWithRolesAndAllowed({
        page: 1,
        limit: 10,
        searchQuery: 'john',
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].email).toBe('john@test.com');
      expect(result.totalItems).toBe(1);
    });

    it('should filter registered users by name search query', async () => {
      const now = new Date().toISOString();
      await userRepository.save(new User('1', 'google-1', 'user1@test.com', 'John Doe'));
      await userRepository.save(new User('2', 'google-2', 'user2@test.com', 'Jane Doe'));

      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });
      await userRepository.assignRole('1', 'user');
      await userRepository.assignRole('2', 'user');
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['user1@test.com', now],
      });
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['user2@test.com', now],
      });

      const result = await userRepository.searchUsersWithRolesAndAllowed({
        page: 1,
        limit: 10,
        searchQuery: 'Jane',
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].email).toBe('user2@test.com');
      expect(result.totalItems).toBe(1);
    });

    it('should filter unregistered allowed users by email search query', async () => {
      const now = new Date().toISOString();
      await userRepository.save(new User('1', 'google-1', 'registered@test.com', 'Registered'));

      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });
      await userRepository.assignRole('1', 'user');
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['registered@test.com', now],
      });
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['unregistered1@test.com', now],
      });
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['unregistered2@test.com', now],
      });

      const result = await userRepository.searchUsersWithRolesAndAllowed({
        page: 1,
        limit: 10,
        searchQuery: 'unregistered1',
        includeAllowedUsers: true,
      });

      expect(result.items.length).toBeGreaterThanOrEqual(1);
      const unregisteredUser = result.items.find((u) => u.email === 'unregistered1@test.com');
      expect(unregisteredUser).toBeDefined();
      expect(result.totalItems).toBeGreaterThanOrEqual(1);
    });

    it('should handle users with multiple roles', async () => {
      const now = new Date().toISOString();
      await userRepository.save(new User('1', 'google-1', 'user1@test.com', 'User 1'));

      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['admin', 'Admin'] });
      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['editor', 'Editor'] });
      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });
      await userRepository.assignRole('1', 'admin');
      await userRepository.assignRole('1', 'editor');
      await userRepository.assignRole('1', 'user');
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['user1@test.com', now],
      });

      const result = await userRepository.searchUsersWithRolesAndAllowed({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].roleIds).toContain('admin');
      expect(result.items[0].roleIds).toContain('editor');
      expect(result.items[0].roleIds).toContain('user');
      expect(result.items[0].roleIds.length).toBe(3);
    });

    it(
      'should handle pagination correctly',
      async () => {
        const now = new Date().toISOString();
        for (let i = 1; i <= 5; i++) {
          await userRepository.save(new User(`user-${i}`, `google-${i}`, `user${i}@test.com`, `User ${i}`));
        }

        await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });
        for (let i = 1; i <= 5; i++) {
          await userRepository.assignRole(`user-${i}`, 'user');
          await client.execute({
            sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
            args: [`user${i}@test.com`, now],
          });
        }

        const page1 = await userRepository.searchUsersWithRolesAndAllowed({ page: 1, limit: 2 });
        const page2 = await userRepository.searchUsersWithRolesAndAllowed({ page: 2, limit: 2 });

        expect(page1.items).toHaveLength(2);
        expect(page1.currentPage).toBe(1);
        expect(page1.totalItems).toBe(5);
        expect(page1.totalPages).toBe(3);
        expect(page2.items).toHaveLength(2);
        expect(page2.currentPage).toBe(2);
        expect(page2.totalItems).toBe(5);
        expect(page2.totalPages).toBe(3);

        const page1Emails = page1.items.map((u) => u.email);
        const page2Emails = page2.items.map((u) => u.email);
        expect(page1Emails).not.toEqual(expect.arrayContaining(page2Emails));
      },
      15000
    );

    it('should set isAllowed correctly based on app_settings_allowed_users', async () => {
      const now = new Date().toISOString();
      await userRepository.save(new User('1', 'google-1', 'allowed@test.com', 'Allowed User'));
      await userRepository.save(new User('2', 'google-2', 'notallowed@test.com', 'Not Allowed User'));

      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });
      await userRepository.assignRole('1', 'user');
      await userRepository.assignRole('2', 'user');
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['allowed@test.com', now],
      });

      const result = await userRepository.searchUsersWithRolesAndAllowed({ page: 1, limit: 10 });

      const allowedUser = result.items.find((u) => u.email === 'allowed@test.com');
      const notAllowedUser = result.items.find((u) => u.email === 'notallowed@test.com');
      expect(allowedUser).toBeDefined();
      expect(allowedUser!.isAllowed).toBe(true);
      expect(notAllowedUser).toBeDefined();
      expect(notAllowedUser!.isAllowed).toBe(false);
    });

    it('should sort results by email case-insensitively', async () => {
      const now = new Date().toISOString();
      await userRepository.save(new User('1', 'google-1', 'zebra@test.com', 'Zebra'));
      await userRepository.save(new User('2', 'google-2', 'Alpha@test.com', 'Alpha'));
      await userRepository.save(new User('3', 'google-3', 'beta@test.com', 'Beta'));

      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });
      await userRepository.assignRole('1', 'user');
      await userRepository.assignRole('2', 'user');
      await userRepository.assignRole('3', 'user');
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['zebra@test.com', now],
      });
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['Alpha@test.com', now],
      });
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['beta@test.com', now],
      });

      const result = await userRepository.searchUsersWithRolesAndAllowed({ page: 1, limit: 10 });

      expect(result.items.length).toBe(3);
      expect(result.items[0].email.toLowerCase()).toBe('alpha@test.com');
      expect(result.items[1].email.toLowerCase()).toBe('beta@test.com');
      expect(result.items[2].email.toLowerCase()).toBe('zebra@test.com');
    });

    it('should return empty result when no users match search query', async () => {
      const now = new Date().toISOString();
      await userRepository.save(new User('1', 'google-1', 'user1@test.com', 'User 1'));

      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });
      await userRepository.assignRole('1', 'user');
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['user1@test.com', now],
      });

      const result = await userRepository.searchUsersWithRolesAndAllowed({
        page: 1,
        limit: 10,
        searchQuery: 'nonexistent',
      });
      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should not include unregistered allowed users when includeAllowedUsers is false', async () => {
      const now = new Date().toISOString();
      await userRepository.save(new User('1', 'google-1', 'registered@test.com', 'Registered'));

      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });
      await userRepository.assignRole('1', 'user');
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['registered@test.com', now],
      });
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['unregistered@test.com', now],
      });

      const result = await userRepository.searchUsersWithRolesAndAllowed({
        page: 1,
        limit: 10,
        includeAllowedUsers: false,
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].email).toBe('registered@test.com');
      const unregisteredUser = result.items.find((u) => u.email === 'unregistered@test.com');
      expect(unregisteredUser).toBeUndefined();
    });
  });

  describe('existsByEmail', () => {
    it('should return true when user with email exists', async () => {
      await userRepository.save(new User('1', 'google-1', 'exists@test.com', 'Test User'));

      const exists = await userRepository.existsByEmail('exists@test.com');
      expect(exists).toBe(true);
    });

    it('should return false when no user with email exists', async () => {
      const exists = await userRepository.existsByEmail('nonexistent@test.com');
      expect(exists).toBe(false);
    });
  });

  describe('existsByGoogleId', () => {
    it('should return true when user with google id exists', async () => {
      await userRepository.save(new User('1', 'google-123', 'test@test.com', 'Test User'));

      const exists = await userRepository.existsByGoogleId('google-123');
      expect(exists).toBe(true);
    });

    it('should return false when no user with google id exists', async () => {
      const exists = await userRepository.existsByGoogleId('nonexistent-google-id');
      expect(exists).toBe(false);
    });
  });

  describe('updateEmailVerified', () => {
    it('should set email_verified to true', async () => {
      const user = new User('1', 'google-1', 'test@test.com', 'Test User', undefined, undefined, undefined, undefined, undefined, false);
      await userRepository.save(user);

      await userRepository.updateEmailVerified('1', true);

      const found = await userRepository.findById('1');
      expect(found?.emailVerified).toBe(true);
    });

    it('should set email_verified to false', async () => {
      const user = new User('1', 'google-1', 'test@test.com', 'Test User', undefined, undefined, undefined, undefined, undefined, true);
      await userRepository.save(user);

      await userRepository.updateEmailVerified('1', false);

      const found = await userRepository.findById('1');
      expect(found?.emailVerified).toBe(false);
    });
  });

  describe('updatePasswordHash', () => {
    it('should update password_hash for user', async () => {
      const user = new User('1', 'google-1', 'test@test.com', 'Test User');
      await userRepository.save(user);

      await userRepository.updatePasswordHash('1', 'new-hashed-password');

      const found = await userRepository.findById('1');
      expect(found?.passwordHash).toBe('new-hashed-password');
    });
  });

  describe('save with password_hash and email_verified', () => {
    it('should persist password_hash and email_verified on insert', async () => {
      const user = new User(
        '1',
        null,
        'email@test.com',
        'Email User',
        undefined,
        undefined,
        undefined,
        undefined,
        'hashed-password',
        true
      );
      await userRepository.save(user);

      const result = await client.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: ['1'] });
      const row = result.rows[0] as any;
      expect(row.password_hash).toBe('hashed-password');
      expect(row.email_verified).toBe(1);
    });

    it('should persist password_hash and email_verified on update', async () => {
      const initialUser = new User('1', 'google-1', 'test@test.com', 'Test User');
      await userRepository.save(initialUser);

      const updatedUser = new User(
        '1',
        'google-1',
        'test@test.com',
        'Test User',
        undefined,
        undefined,
        undefined,
        undefined,
        'updated-hash',
        true
      );
      await userRepository.save(updatedUser);

      const found = await userRepository.findById('1');
      expect(found?.passwordHash).toBe('updated-hash');
      expect(found?.emailVerified).toBe(true);
    });
  });

  describe('replaceUserRole', () => {
    it('should replace all existing roles with a new role', async () => {
      const user = new User('1', 'google-1', 'user@test.com', 'Test User');
      await userRepository.save(user);

      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });
      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['editor', 'Editor'] });
      await userRepository.assignRole('1', 'user');
      await userRepository.assignRole('1', 'editor');

      let roles = await userRepository.getUserRoles('1');
      expect(roles).toContain('user');
      expect(roles).toContain('editor');

      await userRepository.replaceUserRole('1', 'editor');

      roles = await userRepository.getUserRoles('1');
      expect(roles).toHaveLength(1);
      expect(roles).toContain('editor');
      expect(roles).not.toContain('user');
    });

    it('should assign role even if user had no previous roles', async () => {
      const user = new User('1', 'google-1', 'user@test.com', 'Test User');
      await userRepository.save(user);

      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });

      let roles = await userRepository.getUserRoles('1');
      expect(roles).toHaveLength(0);

      await userRepository.replaceUserRole('1', 'user');

      roles = await userRepository.getUserRoles('1');
      expect(roles).toHaveLength(1);
      expect(roles).toContain('user');
    });
  });
});
