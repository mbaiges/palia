export function validateAuthRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env
): void {
  if (env.NODE_ENV === 'production' && env.DEV_AUTH_BYPASS === 'true') {
    throw new Error('DEV_AUTH_BYPASS must not be enabled in production.');
  }
}
