import 'dotenv/config';

import { createHash, randomUUID } from 'node:crypto';

import { UthoObjectStorageDriver } from '../src/modules/storage/utho-object-storage.driver';

async function main() {
  const endpoint = process.env.UTHO_S3_ENDPOINT;
  const region = process.env.UTHO_S3_REGION;
  const bucket = process.env.UTHO_S3_BUCKET;
  const accessKey = process.env.UTHO_S3_ACCESS_KEY;
  const secretKey = process.env.UTHO_S3_SECRET_KEY;
  if (!endpoint || !region || !bucket || !accessKey || !secretKey) {
    throw new Error('Utho object storage configuration is incomplete');
  }

  const storage = new UthoObjectStorageDriver({
    endpoint,
    region,
    accessKey,
    secretKey,
    forcePathStyle: process.env.UTHO_S3_FORCE_PATH_STYLE !== 'false',
  });
  const probeObjectAccess = process.argv.includes('--probe-object-access');
  if (probeObjectAccess) {
    const body = Buffer.from(`utho-storage-verification:${randomUUID()}`);
    const key = `system/storage-verification/${Date.now()}-${randomUUID()}.txt`;
    let uploaded = false;
    try {
      await storage.put({
        bucket,
        key,
        body,
        contentType: 'text/plain',
        contentDisposition: 'attachment; filename="storage-verification.txt"',
        checksumSha256: createHash('sha256').update(body).digest('hex'),
      });
      uploaded = true;
      if (!(await storage.exists(bucket, key))) {
        throw new Error(
          'The verification object was uploaded but cannot be read',
        );
      }
      const object = await storage.get(bucket, key);
      const chunks: Buffer[] = [];
      for await (const rawChunk of object.stream) {
        const chunk: unknown = rawChunk;
        if (typeof chunk === 'string') chunks.push(Buffer.from(chunk));
        else if (chunk instanceof Uint8Array) chunks.push(Buffer.from(chunk));
        else throw new Error('The verification object returned invalid data');
      }
      if (!Buffer.concat(chunks).equals(body)) {
        throw new Error('The verification object content did not round-trip');
      }
    } finally {
      if (uploaded) await storage.delete(bucket, key);
    }
  } else {
    await storage.health(bucket);
  }
  console.log(
    JSON.stringify(
      {
        provider: storage.provider,
        status: 'ready',
        endpointHost: new URL(endpoint).host,
        bucket,
        region,
        verification: probeObjectAccess ? 'object-round-trip' : 'bucket-head',
      },
      null,
      2,
    ),
  );
}

void main().catch((error) => {
  const details = error as {
    name?: string;
    message?: string;
    Code?: string;
    code?: string;
    $metadata?: { httpStatusCode?: number; requestId?: string };
  };
  console.error(
    JSON.stringify(
      {
        name: details.name ?? 'StorageError',
        message: details.message ?? 'Unknown storage error',
        code: details.Code ?? details.code ?? null,
        httpStatusCode: details.$metadata?.httpStatusCode ?? null,
        requestId: details.$metadata?.requestId ?? null,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
