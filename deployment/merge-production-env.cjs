const fs = require('node:fs');
const path = require('node:path');

const [sourcePath, targetPath, backupDirectory] = process.argv.slice(2);

if (!sourcePath || !targetPath || !backupDirectory) {
  throw new Error('Usage: node merge-production-env.cjs SOURCE TARGET BACKUP_DIR');
}

function readEntries(filePath) {
  const entries = new Map();
  const text = fs.readFileSync(filePath, 'utf8');

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) entries.set(match[1], match[2]);
  }

  return { entries, text };
}

function unquote(value) {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

const source = readEntries(sourcePath);
const target = readEntries(targetPath);

const copiedKeys = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRES_IN',
  'BCRYPT_SALT_ROUNDS',
  'UTHO_S3_ENDPOINT',
  'UTHO_S3_REGION',
  'UTHO_S3_BUCKET',
  'UTHO_S3_ACCESS_KEY',
  'UTHO_S3_SECRET_KEY',
];

for (const key of copiedKeys) {
  if (!source.entries.get(key)) throw new Error(`${key} is missing from source env`);
}

const databaseUrl = new URL(unquote(source.entries.get('DATABASE_URL')));
if (databaseUrl.protocol !== 'mysql:') throw new Error('DATABASE_URL must use mysql');
if (!['localhost', '127.0.0.1'].includes(databaseUrl.hostname)) {
  throw new Error('Production DATABASE_URL must target MySQL on this VPS');
}
if (databaseUrl.pathname !== '/lms') throw new Error('DATABASE_URL must target lms');

const accessSecret = unquote(source.entries.get('JWT_ACCESS_SECRET'));
const refreshSecret = unquote(source.entries.get('JWT_REFRESH_SECRET'));
if (accessSecret.length < 32 || refreshSecret.length < 32) {
  throw new Error('JWT secrets must contain at least 32 characters');
}
if (accessSecret === refreshSecret) throw new Error('JWT secrets must be different');

const replacements = new Map();
for (const key of copiedKeys) replacements.set(key, source.entries.get(key));

replacements.set('NODE_ENV', 'production');
replacements.set('PORT', '5000');
replacements.set('FRONTEND_URL', 'http://lms.fyolicrafts.com');
replacements.set('PUBLIC_API_URL', 'http://lms.fyolicrafts.com');
replacements.set('ACTIVITY_RETENTION_WORKER_ENABLED', 'true');
replacements.set('STORAGE_PROVIDER', 'utho_s3');
replacements.set('UTHO_S3_FORCE_PATH_STYLE', 'true');
replacements.set('UTHO_S3_MAX_UPLOAD_BYTES', '26214400');

const updatedKeys = new Set();
const outputLines = target.text.split(/\r?\n/).map((line) => {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
  if (!match || !replacements.has(match[1])) return line;

  updatedKeys.add(match[1]);
  return `${match[1]}=${replacements.get(match[1])}`;
});

for (const [key, value] of replacements) {
  if (!updatedKeys.has(key)) outputLines.push(`${key}=${value}`);
}

fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDirectory, `backend.env.${timestamp}`);
fs.copyFileSync(targetPath, backupPath);
fs.chmodSync(backupPath, 0o600);

const temporaryPath = `${targetPath}.next`;
fs.writeFileSync(temporaryPath, `${outputLines.join('\n').replace(/\n+$/, '')}\n`, {
  mode: 0o600,
});
fs.renameSync(temporaryPath, targetPath);
fs.chmodSync(targetPath, 0o600);

console.log(
  JSON.stringify({
    backupCreated: true,
    updatedKeyCount: replacements.size,
    databaseHost: databaseUrl.hostname,
    databaseName: databaseUrl.pathname.slice(1),
    storageProvider: 'utho_s3',
  }),
);
