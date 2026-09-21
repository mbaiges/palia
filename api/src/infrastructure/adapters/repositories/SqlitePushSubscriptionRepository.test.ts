import 'reflect-metadata';
import { SqlitePushSubscriptionRepository } from '@/infrastructure/adapters/repositories/SqlitePushSubscriptionRepository';
import { SqliteUserRepository } from '@/infrastructure/adapters/repositories/SqliteUserRepository';
import { User } from '@/domain/models/User';
import { DatabaseConfig } from '@/infrastructure/config/database';

describe('SqlitePushSubscriptionRepository', () => {
  let repository: SqlitePushSubscriptionRepository;
  let userRepository: SqliteUserRepository;
  const userId = 'user-push-1';

  beforeEach(async () => {
    await DatabaseConfig.clean();
    repository = new SqlitePushSubscriptionRepository();
    userRepository = new SqliteUserRepository();
    await userRepository.save(
      new User(userId, 'google-1', 'test@example.com', 'Test User')
    );
  });

  describe('save', () => {
    it('should insert new subscription and findByUserId returns it', async () => {
      await repository.save(userId, {
        endpoint: 'https://push.example.com/1',
        keys: { p256dh: 'key1', auth: 'auth1' },
      });

      const subs = await repository.findByUserId(userId);
      expect(subs).toHaveLength(1);
      expect(subs[0].userId).toBe(userId);
      expect(subs[0].endpoint).toBe('https://push.example.com/1');
      expect(subs[0].p256dh).toBe('key1');
      expect(subs[0].auth).toBe('auth1');
      expect(subs[0].id).toBeDefined();
      expect(subs[0].createdAt).toBeDefined();
    });

    it('should upsert when same user_id and endpoint - updates keys', async () => {
      await repository.save(userId, {
        endpoint: 'https://push.example.com/same',
        keys: { p256dh: 'key-old', auth: 'auth-old' },
      });

      const first = await repository.findByUserId(userId);
      expect(first).toHaveLength(1);
      expect(first[0].p256dh).toBe('key-old');

      await repository.save(userId, {
        endpoint: 'https://push.example.com/same',
        keys: { p256dh: 'key-new', auth: 'auth-new' },
      });

      const second = await repository.findByUserId(userId);
      expect(second).toHaveLength(1);
      expect(second[0].p256dh).toBe('key-new');
      expect(second[0].auth).toBe('auth-new');
    });
  });

  describe('findByUserId', () => {
    it('returns empty when no subscriptions', async () => {
      const subs = await repository.findByUserId(userId);
      expect(subs).toEqual([]);
    });

    it('should return all subscriptions for user', async () => {
      await repository.save(userId, {
        endpoint: 'https://push.example.com/a',
        keys: { p256dh: 'k1', auth: 'a1' },
      });
      await repository.save(userId, {
        endpoint: 'https://push.example.com/b',
        keys: { p256dh: 'k2', auth: 'a2' },
      });

      const subs = await repository.findByUserId(userId);
      expect(subs).toHaveLength(2);
      const endpoints = subs.map(s => s.endpoint).sort();
      expect(endpoints).toEqual([
        'https://push.example.com/a',
        'https://push.example.com/b',
      ]);
    });
  });

  describe('deleteByEndpoint', () => {
    it('should remove subscription', async () => {
      await repository.save(userId, {
        endpoint: 'https://push.example.com/delete-me',
        keys: { p256dh: 'k', auth: 'a' },
      });

      await repository.deleteByEndpoint('https://push.example.com/delete-me');

      const subs = await repository.findByUserId(userId);
      expect(subs).toHaveLength(0);
    });

    it('scopes user-initiated deletion to the authenticated owner', async () => {
      const otherUserId = 'user-push-2';
      await userRepository.save(
        new User(otherUserId, 'google-2', 'other@example.com', 'Other User')
      );
      await repository.save(userId, {
        endpoint: 'https://push.example.com/scoped-delete',
        keys: { p256dh: 'k1', auth: 'a1' },
      });

      await repository.deleteByUserAndEndpoint(
        otherUserId,
        'https://push.example.com/scoped-delete'
      );
      expect(await repository.findByUserId(userId)).toHaveLength(1);

      await repository.deleteByUserAndEndpoint(
        userId,
        'https://push.example.com/scoped-delete'
      );
      expect(await repository.findByUserId(userId)).toHaveLength(0);
    });
  });
});
