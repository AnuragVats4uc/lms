import type { Request } from 'express';

import { extractAuthRequestMetadata } from './auth-request-metadata';

describe('authentication request metadata', () => {
  it('extracts and normalizes trusted request details', () => {
    const request = {
      headers: { 'x-request-id': 'request-123' },
      ips: [],
      ip: '::ffff:192.0.2.15',
      socket: {},
      get: (name: string) =>
        name === 'user-agent' ? 'Example Browser' : undefined,
    } as unknown as Request;

    expect(extractAuthRequestMetadata(request)).toEqual({
      ipAddress: '192.0.2.15',
      userAgent: 'Example Browser',
      requestId: 'request-123',
    });
  });

  it('uses only trusted proxy addresses exposed by Express', () => {
    const request = {
      headers: { 'x-forwarded-for': '198.51.100.99' },
      ips: [],
      ip: '10.0.0.5',
      socket: {},
      get: () => undefined,
    } as unknown as Request;

    expect(extractAuthRequestMetadata(request).ipAddress).toBe('10.0.0.5');
  });
});
