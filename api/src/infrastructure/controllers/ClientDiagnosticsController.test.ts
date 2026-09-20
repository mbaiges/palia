import { ClientDiagnosticsController } from './ClientDiagnosticsController';

describe('ClientDiagnosticsController', () => {
  it('accepts bounded redacted diagnostics and returns an incident id', () => {
    const controller = new ClientDiagnosticsController();
    const json = jest.fn();
    const response = { status: jest.fn().mockReturnThis(), json } as any;
    controller.receive({ body: { kind: 'http_5xx', message: 'token=secret password=hunter2', stack: 'line\nnext' }, header: () => undefined } as any, response);
    expect(response.status).toHaveBeenCalledWith(202);
    expect(json.mock.calls[0][0].accepted).toBe(true);
    expect(json.mock.calls[0][0].incidentId).toEqual(expect.any(String));
  });

  it('redacts complete bearer credentials and token assignments from persisted diagnostics', () => {
    const controller = new ClientDiagnosticsController();
    const received = jest.fn();
    const response = { status: jest.fn().mockReturnThis(), json: received } as any;
    controller.receive({
      body: {
        incidentId: 'redaction-test',
        message: 'Authorization: Bearer top-secret-value',
        stack: 'request token=another-secret-value',
      },
      header: () => undefined,
    } as any, response);

    expect(received.mock.calls[0][0].accepted).toBe(true);
    const listed = jest.fn();
    controller.list({} as any, { json: listed } as any);
    const record = listed.mock.calls[0][0].diagnostics.find((entry: { incidentId: string }) => entry.incidentId === 'redaction-test');
    expect(record.message).not.toContain('top-secret-value');
    expect(record.stack).not.toContain('another-secret-value');
  });

  it('redacts embedded image data URLs before persisting client logs', () => {
    const controller = new ClientDiagnosticsController();
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    controller.receive({
      body: { incidentId: 'image-redaction-test', message: 'upload failed data:image/png;base64,QUJDREVGRw== end' },
      header: () => undefined,
    } as any, response);
    const listed = jest.fn();
    controller.list({} as any, { json: listed } as any);
    const record = listed.mock.calls[0][0].diagnostics.find((entry: { incidentId: string }) => entry.incidentId === 'image-redaction-test');
    expect(record.message).toContain('[REDACTED_IMAGE_DATA]');
    expect(record.message).not.toContain('QUJDREVGRw==');
  });
});
