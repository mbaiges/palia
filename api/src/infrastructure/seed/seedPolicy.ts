export function isSeedResetAllowed(environment = process.env.NODE_ENV, useLocalDb = process.env.USE_LOCAL_DB): boolean {
  const normalizedEnvironment = environment || 'development';
  return ['development', 'test', 'e2e'].includes(normalizedEnvironment) && useLocalDb === 'true';
}
