import { PingController } from './PingController';
import { DatabaseConfig } from '@/infrastructure/config/database';

describe('PingController shared probes', () => {
  const controller = new PingController();

  it('exposes live and ready as empty status-only responses', async () => {
    const response = { status: jest.fn().mockReturnThis(), end: jest.fn() } as any;
    controller.live({} as any, response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.end).toHaveBeenCalled();

    const connection = { execute: jest.fn().mockResolvedValue({ rows: [{ 1: 1 }] }) };
    const spy = jest.spyOn(DatabaseConfig, 'getConnection').mockReturnValue(connection as any);
    await controller.ready({} as any, response);
    expect(connection.execute).toHaveBeenCalledWith('SELECT 1');
    expect(response.status).toHaveBeenLastCalledWith(200);
    spy.mockRestore();
  });

  it('reports only non-secret public feature configuration', () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    controller.config({} as any, response);
    const config = response.json.mock.calls[0][0];
    expect(config).toHaveProperty('environment');
    expect(config).toHaveProperty('emailAuthEnabled');
    expect(config).toHaveProperty('emailProviderConfigured');
    expect(config).toHaveProperty('googleProviderConfigured');
    expect(config).toHaveProperty('httpsClientOrigin');
    expect(JSON.stringify(config)).not.toMatch(/secret|token|key/i);
  });
});
