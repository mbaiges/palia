import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HttpApiRepository } from './apiRepository.js';

describe('HttpApiRepository', () => {
  it('maps transport envelopes to domain values', async () => {
    const repository = new HttpApiRepository({
      bootstrap: async () => ({ data: { userId: 'u1', patients: [] } }),
      patients: {
        create: async () => ({ data: { id: 'p1' } }),
        createFollowUp: async () => ({ data: { id: 'f1' } }),
      },
    });

    assert.deepEqual(await repository.bootstrap(), { userId: 'u1', patients: [] });
    assert.deepEqual(await repository.patients.create({ name: 'Ada' }), { id: 'p1' });
    assert.deepEqual(await repository.patients.createFollowUp('p1', {}), { id: 'f1' });
  });

  it('keeps non-envelope responses unchanged', async () => {
    const repository = new HttpApiRepository({
      push: { vapidPublicKey: async () => ({ publicKey: 'key' }) },
    });

    assert.deepEqual(await repository.push.vapidPublicKey(), { publicKey: 'key' });
  });
});

