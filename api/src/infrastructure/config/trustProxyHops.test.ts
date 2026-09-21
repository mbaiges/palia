import { parseTrustProxyHops } from '@/infrastructure/config/server';

describe('parseTrustProxyHops', () => {
  it('does not trust a proxy by default', () => {
    expect(parseTrustProxyHops(undefined)).toBe(0);
    expect(parseTrustProxyHops('')).toBe(0);
  });

  it('accepts an explicit bounded number of proxy hops', () => {
    expect(parseTrustProxyHops('1')).toBe(1);
    expect(parseTrustProxyHops(' 2 ')).toBe(2);
    expect(parseTrustProxyHops('0')).toBe(0);
  });

  it.each(['true', '-1', '1.5', '11', '999999999999999999999'])(
    'rejects unsafe proxy value %s',
    value => {
      expect(() => parseTrustProxyHops(value)).toThrow('TRUST_PROXY_HOPS');
    }
  );
});
