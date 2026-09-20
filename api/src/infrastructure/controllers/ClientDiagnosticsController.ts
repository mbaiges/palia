import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { logger } from '@/domain/utils/logger';

export interface ClientDiagnosticRecord {
  incidentId: string;
  requestId?: string;
  kind: string;
  release?: string;
  route?: string;
  browser?: string;
  name?: string;
  message: string;
  stack?: string;
  sessionId?: string;
  createdAt: string;
}

const MAX_FIELD = 512;
const MAX_STACK = 4000;
const MAX_RECORDS = 200;
const SENSITIVE = /(authorization|cookie|token|password|secret|api[-_]?key)/i;

const clean = (value: unknown, limit = MAX_FIELD): string | undefined => {
  if (typeof value !== 'string') return undefined;
  return value.replace(/[\r\n]+/g, ' ').slice(0, limit);
};

const redact = (value: unknown): string | undefined => {
  const text = clean(value, MAX_STACK);
  if (!text) return text;
  return text
    .replace(/data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+/gi, '[REDACTED_IMAGE_DATA]')
    .replace(/(authorization)\s*[:=]\s*(?:bearer\s+)?[^\s,;]+(?:\s+[^\s,;]+)?/gi, '$1=[REDACTED]')
    .replace(/(cookie|token|password|secret|api[-_]?key)\s*[:=]\s*[^,; ]+/gi, '$1=[REDACTED]');
};

const records: ClientDiagnosticRecord[] = [];

export class ClientDiagnosticsController {
  receive(req: Request, res: Response): void {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const record: ClientDiagnosticRecord = {
      incidentId: clean(body.incidentId) ?? crypto.randomUUID(),
      requestId: clean(body.requestId) ?? clean(req.header('X-Request-ID')),
      kind: clean(body.kind) ?? 'unknown',
      release: clean(body.release), route: clean(body.route), browser: clean(body.browser),
      name: clean(body.name), message: redact(body.message) ?? 'Unknown client error',
      stack: redact(body.stack, ), sessionId: clean(body.sessionId), createdAt: new Date().toISOString(),
    };
    records.push(record);
    if (records.length > MAX_RECORDS) records.shift();
    logger.error('frontend.client_error', record);
    res.status(202).json({ accepted: true, incidentId: record.incidentId });
  }

  list(_req: Request, res: Response): void { res.json({ diagnostics: [...records].reverse() }); }
}

export const clientDiagnosticsController = new ClientDiagnosticsController();
