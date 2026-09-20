import {
  isDevLanOrigin,
  isOriginAllowed,
  isPrivateLanHostname,
  parseAllowedOrigins,
} from '@/domain/utils/corsOrigins';

describe('corsOrigins', () => {
  const prevNodeEnv = process.env.NODE_ENV;
  const prevBypass = process.env.DEV_AUTH_BYPASS;

  afterEach(() => {
    process.env.NODE_ENV = prevNodeEnv;
    if (prevBypass === undefined) delete process.env.DEV_AUTH_BYPASS;
    else process.env.DEV_AUTH_BYPASS = prevBypass;
  });

  it('parses CLIENT_URL list', () => {
    expect(parseAllowedOrigins('http://a:5173, http://b:5173')).toEqual([
      'http://a:5173',
      'http://b:5173',
    ]);
  });

  it('detects private LAN hostnames', () => {
    expect(isPrivateLanHostname('192.168.1.8')).toBe(true);
    expect(isPrivateLanHostname('10.0.0.2')).toBe(true);
    expect(isPrivateLanHostname('172.16.0.1')).toBe(true);
    expect(isPrivateLanHostname('8.8.8.8')).toBe(false);
  });

  it('allows LAN origins in development', () => {
    process.env.NODE_ENV = 'development';
    expect(isDevLanOrigin('http://192.168.1.8:5173')).toBe(true);
    expect(isOriginAllowed('http://192.168.1.8:5173', ['http://localhost:5173'])).toBe(true);
  });

  it('rejects unknown public origins when not listed', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DEV_AUTH_BYPASS;
    expect(isOriginAllowed('https://evil.example', parseAllowedOrigins())).toBe(false);
  });
});
