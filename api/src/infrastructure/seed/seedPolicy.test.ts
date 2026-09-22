import { isSeedResetAllowed } from './seedPolicy';

describe('seed reset policy', () => {
  it('allows reset only for local testable environments', () => {
    expect(isSeedResetAllowed('development', 'true')).toBe(true);
    expect(isSeedResetAllowed('test', 'true')).toBe(true);
    expect(isSeedResetAllowed('e2e', 'true')).toBe(true);
  });

  it('rejects reset in staging, production and non-local databases', () => {
    expect(isSeedResetAllowed('staging', 'true')).toBe(false);
    expect(isSeedResetAllowed('production', 'true')).toBe(false);
    expect(isSeedResetAllowed('development', 'false')).toBe(false);
  });
});
