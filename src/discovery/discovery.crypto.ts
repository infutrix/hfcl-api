import { createHmac, timingSafeEqual } from 'node:crypto';

export interface DiscoverySignableFields {
  type: string;
  version: number;
  host: string;
  port: number;
  timestamp: number;
}

/**
 * Field order/format must match byte-for-byte between hfcl-api and hfcl-app
 * so the HMAC computed on either side is identical.
 */
function buildSigningString(fields: DiscoverySignableFields): string {
  return `${fields.type}|${fields.version}|${fields.host}|${fields.port}|${fields.timestamp}`;
}

export function signDiscoveryPayload(
  fields: DiscoverySignableFields,
  secret: string,
): string {
  return createHmac('sha256', secret)
    .update(buildSigningString(fields))
    .digest('hex');
}

export function verifyDiscoverySignature(
  fields: DiscoverySignableFields,
  signature: string,
  secret: string,
): boolean {
  const expected = Buffer.from(signDiscoveryPayload(fields, secret), 'hex');

  let actual: Buffer;
  try {
    actual = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }

  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}
