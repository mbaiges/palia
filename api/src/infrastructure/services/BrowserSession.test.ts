import type { Request, Response } from 'express';

describe('BrowserSession production cookie policy', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });

  it('uses secure __Host cookies with the expected browser protections', () => {
    process.env.NODE_ENV = 'production';
    let browserSession!: typeof import('./BrowserSession');
    jest.isolateModules(() => {
      browserSession = require('./BrowserSession');
    });

    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;

    const csrfToken = browserSession.issueCsrfToken({} as Request, response);
    browserSession.clearBrowserSession(response);

    expect(csrfToken).toEqual(expect.any(String));
    expect(response.cookie).toHaveBeenCalledWith(
      '__Host-medice_csrf',
      csrfToken,
      expect.objectContaining({
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        path: '/',
      })
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      '__Host-medice_session',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      })
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      '__Host-medice_csrf',
      expect.objectContaining({
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        path: '/',
      })
    );
  });
});
