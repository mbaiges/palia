import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultHttpApiRepository } from './apiRepository.js';
import { IndexedDBApiRepository } from './indexedDbApiRepository.js';

const contract = [
  ['auth', ['me', 'google', 'devBypass', 'signOut']],
  ['patients', ['list', 'get', 'create', 'update', 'archive', 'restore', 'assign', 'followUps', 'createFollowUp', 'createAlert']],
  ['alerts', ['list', 'resolve']],
  ['hospitals', ['list', 'create', 'update', 'archive', 'restore']],
  ['volunteers', ['list', 'updateProfile']],
  ['access', ['list', 'addVolunteer', 'remove']],
  ['stats', ['mine', 'global']],
  ['push', ['vapidPublicKey', 'subscribe', 'unsubscribe']],
];

test('HTTP and IndexedDB adapters expose the same repository port', () => {
  for (const Adapter of [DefaultHttpApiRepository, IndexedDBApiRepository]) {
    const repository = new Adapter();
    for (const [group, methods] of contract) {
      assert.ok(repository[group], `${Adapter.name} is missing ${group}`);
      for (const method of methods) assert.equal(typeof repository[group][method], 'function', `${Adapter.name}.${group}.${method}`);
    }
  }
});
