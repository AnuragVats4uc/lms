import type { Request } from 'express';

import { ActivityRequestMetadata } from '../../activity/types/activity.types';

export function extractAuthRequestMetadata(
  request: Request,
): ActivityRequestMetadata {
  const requestIdHeader = request.headers['x-request-id'];
  const requestId = Array.isArray(requestIdHeader)
    ? requestIdHeader[0]
    : requestIdHeader;
  const trustedClientIp = request.ips[0] ?? request.ip;
  const generatedRequestId =
    typeof request.id === 'string' || typeof request.id === 'number'
      ? String(request.id)
      : undefined;

  return {
    ipAddress: normalizeIpAddress(
      trustedClientIp ?? request.socket.remoteAddress,
    ),
    userAgent: request.get('user-agent') ?? null,
    requestId: truncate(requestId ?? generatedRequestId, 100),
  };
}

function normalizeIpAddress(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.startsWith('::ffff:') ? value.slice(7) : value;
  return truncate(normalized, 45);
}

function truncate(value: string | undefined, length: number): string | null {
  if (!value) return null;
  return value.slice(0, length);
}
