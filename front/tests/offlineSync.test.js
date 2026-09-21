import test from 'node:test';
import assert from 'node:assert/strict';
import { classifySyncFailure } from '../src/services/offlineSyncStatus.js';

test('offline follow-ups require review when authorization or payload conflicts block delivery', () => {
  for (const status of [403, 404, 409, 422]) {
    assert.equal(classifySyncFailure({ status }), 'needs-review');
  }
});

test('offline follow-ups remain retryable for authentication and transient server failures', () => {
  for (const status of [401, 408, 429, 500, undefined]) {
    assert.equal(classifySyncFailure({ status }), 'pending');
  }
});
