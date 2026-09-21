import { validateAuthRuntimeConfig } from './authRuntimeConfig';

describe('validateAuthRuntimeConfig', () => {
  it('rejects the development identity bypass in production', () => {
    expect(() =>
      validateAuthRuntimeConfig({
        NODE_ENV: 'production',
        DEV_AUTH_BYPASS: 'true',
      } as NodeJS.ProcessEnv)
    ).toThrow('DEV_AUTH_BYPASS must not be enabled in production.');
  });

  it('allows test and development environments to opt into the bypass', () => {
    expect(() =>
      validateAuthRuntimeConfig({
        NODE_ENV: 'test',
        DEV_AUTH_BYPASS: 'true',
      } as NodeJS.ProcessEnv)
    ).not.toThrow();
    expect(() =>
      validateAuthRuntimeConfig({
        NODE_ENV: 'development',
        DEV_AUTH_BYPASS: 'false',
      } as NodeJS.ProcessEnv)
    ).not.toThrow();
  });
});
