import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import seed from '../../../seed/medice-seed.json' with { type: 'json' };

describe('shared Medice seed', () => {
  it('covers the complete demo domain with stable unique identifiers', () => {
    assert.ok(seed.seedVersion);
    assert.equal(new Set(seed.users.map((user) => user.id)).size, seed.users.length);
    assert.equal(new Set(seed.patients.map((patient) => patient.id)).size, seed.patients.length);
    assert.equal(new Set(seed.followUps.map((item) => item.id)).size, seed.followUps.length);
    assert.equal(new Set(seed.alerts.map((item) => item.id)).size, seed.alerts.length);
    assert.ok(seed.patients.some((patient) => patient.archivedAt));
    assert.ok(seed.alerts.filter((alert) => alert.status === 'active').length >= 2);
    assert.ok(seed.followUps.some((item) => item.durationMinutes === 45));
    assert.deepEqual(seed.users.map((user) => user.role).sort(), ['admin', 'coordinator', 'volunteer']);
  });
});

