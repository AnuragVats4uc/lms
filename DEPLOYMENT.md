# LMS free-tier deployment runbook

This repository is one Git repository containing two independent Node projects. There is intentionally no root `package.json`.

```text
GitHub
├── frontend/apps/web (Next.js 16) ──> Vercel Hobby
└── backend (NestJS 11 + Prisma 6) ──> Render Free ──TLS──> Aiven MySQL 8.4
```

The Expo app in `frontend/apps/mobile` is part of the frontend pnpm workspace but is not deployed by the Vercel web project.

There are 14 manifests: `backend/package.json`; `frontend/package.json`; the `web` and `mobile` app manifests; and manifests for `api`, `assets`, `auth`, `eslint-config`, `hooks`, `types`, `typescript-config`, `ui`, `utils`, and `validation` under `frontend/packages`. `frontend/pnpm-workspace.yaml` includes `apps/*` and `packages/*`. The backend is a separate pnpm project rather than a member of that workspace.

## Repository findings

| Area | Repository-specific result |
| --- | --- |
| Git branch/remote | `exam-module`; `origin` is `https://github.com/AnuragVats4uc/lms.git` |
| Frontend workspace | `frontend`; pnpm 10.4.1 + Turborepo; Node 22 |
| Web app | `frontend/apps/web`; Next.js 16.2.9 App Router + React 19.2.4 |
| Mobile app | `frontend/apps/mobile`; Expo 57 + React Native 0.86 |
| Backend | `backend`; NestJS 11 REST API; pnpm 10.4.1 + Node 22 |
| Database | Prisma 6.19.3 using the `mysql` provider and one `DATABASE_URL` |
| Schema | 46 Prisma models, 23 enums, 14 SQL migrations; foreign keys and indexes are migration-managed |
| Authentication | JWT access/refresh tokens sent as `Authorization: Bearer ...`; browser tokens use `localStorage`, not cookies |
| Local ports | web `3000`; API `5000`; MySQL-compatible server `3306` |
| API prefix | `/api/v1`; health check `GET /api/v1`; Swagger `/api/docs` |
| Uploads | API writes to `backend/uploads/resources` and `backend/uploads/exam-imports` |

The previous `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND` occurred because pnpm was run from the Git root. Run frontend commands in `frontend` and backend commands in `backend`. No root workspace file should be added: these are deliberately separate lockfiles and dependency graphs.

The local server inspected during preparation is MariaDB 10.4.28 from XAMPP, serving the `lms` database with `utf8mb4`. The application remains a MySQL application: Prisma's provider is `mysql`, all production changes target Aiven MySQL, and no PostgreSQL package, adapter, SQL, or migration was introduced. The schema uses MySQL JSON columns, so use MySQL 5.7 or newer; this runbook uses Aiven MySQL 8.4 LTS.

## Local development

Install Node.js 22 and activate the repository's package-manager version:

```powershell
corepack enable
corepack prepare pnpm@10.4.1 --activate
```

Start the API:

```powershell
Set-Location C:\Users\gaura\Desktop\lms\backend
Copy-Item .env.example .env
# Edit .env without committing it.
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm run db:migrate:deploy
pnpm run start:dev
```

In another terminal, start the web app:

```powershell
Set-Location C:\Users\gaura\Desktop\lms\frontend
Copy-Item apps/web/.env.example apps/web/.env.local
pnpm install --frozen-lockfile
pnpm --filter web dev
```

`frontend` also supports `pnpm dev`, which starts workspace development tasks, and `pnpm --filter mobile start` for Expo. The web app uses `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1` locally.

Do not run `pnpm seed`, `pnpm seed:students`, or `pnpm seed:resources` against production. They create known demo data/passwords; they now refuse to run when `NODE_ENV=production`.

## Aiven MySQL

### Create the service

1. Create an Aiven account and project.
2. Create an **Aiven for MySQL** service with the **Free** plan and **MySQL 8.4**.
3. Aiven currently chooses the cloud/region for a Free service; it cannot be pinned. Record the service's host, port, `avnadmin` username, generated password, and CA certificate from the Overview page.
4. Download the CA certificate as `aiven-ca.pem`. Do not commit it.
5. Create a fresh database named `lms` with character set `utf8mb4` and collation `utf8mb4_unicode_ci`.

The Aiven Free plan currently provides 1 CPU, 1 GB RAM, 1 GB disk, backups, and at most 76 connections. This backend deliberately limits Prisma to five connections.

Create the database over a CA-verified connection (the client prompts for the password):

```powershell
& 'C:\xampp\mysql\bin\mysql.exe' --host=AIVEN_HOST --port=AIVEN_PORT --user=avnadmin --password --ssl --ssl-ca='C:\absolute\path\aiven-ca.pem' --ssl-verify-server-cert --execute="CREATE DATABASE lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Run this only for a new service. If `lms` already exists, inspect it instead of replacing or clearing it.

### Create the target schema

Use the repository migrations instead of importing MariaDB-generated DDL into MySQL 8.4. Percent-encode reserved characters in the Aiven password before placing it in a URL. In PowerShell, set the URL only for the current process:

```powershell
Set-Location C:\Users\gaura\Desktop\lms\backend
$env:DATABASE_URL='mysql://avnadmin:PERCENT_ENCODED_PASSWORD@AIVEN_HOST:AIVEN_PORT/lms?sslcert=C:/absolute/path/aiven-ca.pem&sslaccept=strict&connection_limit=5'
$env:NODE_ENV='production'
pnpm exec prisma generate
pnpm run db:migrate:deploy
pnpm run db:migrate:status
```

The expected result is 14 applied migrations and no pending migration.

### Copy the existing local data safely

Do not delete or alter the local database. First create a full recovery dump using the XAMPP client that is installed on this machine:

```powershell
& 'C:\xampp\mysql\bin\mysqldump.exe' --host=localhost --port=3306 --user=root --password --single-transaction --quick --routines --triggers --events --hex-blob --default-character-set=utf8mb4 --result-file=lms-full-backup.sql lms
```

Keep that file private and outside Git. Because the source is MariaDB 10.4 and the destination is MySQL 8.4, use Prisma migrations for the target DDL and make a data-only transfer. `--replace` safely handles the few lookup rows created by migrations; the target must otherwise be fresh and empty.

```powershell
& 'C:\xampp\mysql\bin\mysqldump.exe' --host=localhost --port=3306 --user=root --password --single-transaction --quick --skip-lock-tables --no-create-info --skip-triggers --replace --hex-blob --default-character-set=utf8mb4 --ignore-table=lms._prisma_migrations --result-file=lms-data.sql lms
```

Import over a CA-verified TLS connection. Use forward slashes in MySQL's `SOURCE` path; the client still prompts for the Aiven password:

```powershell
& 'C:\xampp\mysql\bin\mysql.exe' --host=AIVEN_HOST --port=AIVEN_PORT --user=avnadmin --password --ssl --ssl-ca='C:\absolute\path\aiven-ca.pem' --ssl-verify-server-cert lms --execute="SOURCE C:/Users/gaura/Desktop/lms/backend/lms-data.sql"
```

Verify the copy:

```powershell
& 'C:\xampp\mysql\bin\mysql.exe' --host=AIVEN_HOST --port=AIVEN_PORT --user=avnadmin --password --ssl --ssl-ca='C:\absolute\path\aiven-ca.pem' --ssl-verify-server-cert lms
```

At the MySQL prompt:

```sql
SELECT VERSION(), DATABASE(), @@character_set_database, @@collation_database;
SOURCE C:/Users/gaura/Desktop/lms/backend/scripts/database-audit.sql;
SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;
```

Run `pnpm run db:migrate:status` one more time against Aiven. Do not run a seeder after importing the existing data.

### Measured database size

The local `lms` database is **3,588,096 bytes (3.42 MiB)**, roughly 0.34% of Aiven's 1 GB limit. Its largest table, `exam_import_rows`, is about 0.23 MiB; the next largest tables are about 0.14 MiB each. Capacity is not currently a blocker. Use `backend/scripts/database-audit.sql` periodically for total size, largest tables, index size, and InnoDB's approximate row counts. Exact row counts for a particular table can be obtained with `SELECT COUNT(*) FROM table_name;`.

## Render backend

The checked-in `render.yaml` is the preferred setup. In Render, choose **New > Blueprint**, connect the GitHub repository, select branch `exam-module`, and apply the Blueprint.

| Setting | Exact value |
| --- | --- |
| Service type | Web Service |
| Name | `lms-backend-api` (or note the actual generated URL if this name is unavailable) |
| Runtime | Node |
| Plan | Free |
| Region | Singapore |
| Root Directory | `backend` |
| Node version | 22, enforced by `backend/package.json` |
| Build Command | `pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm run build` |
| Start Command | `pnpm run start:render` |
| Health Check Path | `/api/v1` |

Add a Render **secret file** named `aiven-ca.pem` containing the downloaded Aiven CA. Render mounts it as `/etc/secrets/aiven-ca.pem`.

Set these variables in Render:

```dotenv
NODE_ENV=production
NODE_VERSION=22.23.2
DATABASE_URL=mysql://avnadmin:PERCENT_ENCODED_PASSWORD@AIVEN_HOST:AIVEN_PORT/lms?sslcert=/etc/secrets/aiven-ca.pem&sslaccept=strict&connection_limit=5
FRONTEND_URL=https://YOUR_VERCEL_PROJECT.vercel.app
PUBLIC_API_URL=https://YOUR_RENDER_SERVICE.onrender.com
JWT_ACCESS_SECRET=<unique random secret generated by Render>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<different unique random secret generated by Render>
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
```

Do not set `PORT`; Render supplies it. The application reads it and binds to `0.0.0.0`. The start command applies pending Prisma migrations before starting Node because Render's pre-deploy command is unavailable on a Free service.

After deployment, confirm:

```powershell
Invoke-RestMethod https://YOUR_RENDER_SERVICE.onrender.com/api/v1
```

The response must identify `LMS Backend` and report `Running Successfully`.

## Vercel frontend

Import the same GitHub repository as a Vercel project and use:

| Setting | Exact value |
| --- | --- |
| Git branch | `exam-module` |
| Root Directory | `frontend/apps/web` |
| Framework Preset | Next.js |
| Node version | 22 |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |
| Build Command | `cd ../.. && pnpm --filter web build` |
| Output Directory | `.next` (framework default; leave the dashboard override blank) |

Set this Production environment variable before the first production build:

```dotenv
NEXT_PUBLIC_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api/v1
```

The value is embedded during `next build`; changing it requires a redeploy. The app's nested routes are native Next.js App Router routes, so Vercel handles direct refreshes without an SPA fallback rewrite. No additional rewrite is required.

After Vercel assigns the final domain, update `FRONTEND_URL` in Render to that exact origin, without a path or trailing slash, and redeploy the backend. Multiple approved origins can be comma-separated (for example, a production domain and a custom domain). CORS is intentionally not `*`. Cookie credentials are not enabled because authentication uses bearer JWTs rather than cookies.

## GitHub publish commands

Review before committing; do not add `.env`, PEM, dump, or upload files:

```powershell
Set-Location C:\Users\gaura\Desktop\lms
git status --short
git diff --check
git add DEPLOYMENT.md render.yaml backend frontend
git status --short
git commit -m "chore: prepare LMS for free-tier deployment"
git push -u origin exam-module
```

## Free-tier limitations and remaining decisions

1. **Uploads are not durable on Render Free.** The current API stores uploaded resources and exam import source files under `backend/uploads`. Render loses those files after a restart, redeploy, or 15-minute idle spin-down, and persistent disks require a paid service. Database records remain in Aiven, but their local file targets can disappear. Public testing works; durable upload functionality requires either paid Render disk storage or a future object-storage integration. No files or data were deleted during preparation.
2. **Cold starts are expected.** Render Free sleeps after 15 idle minutes and can take about a minute to wake.
3. **Vercel Hobby is only for personal, non-commercial use.** If this LMS is used commercially, Vercel's terms require a paid plan or a different frontend host.
4. **Known demo credentials exist in seed source.** The production guards prevent accidental seeding, but any demo accounts already present in the imported database must have their passwords rotated or be removed through an approved administrative workflow before public launch.
5. **Third-party access remains required.** The repository cannot create accounts or obtain the GitHub, Aiven, Render, and Vercel credentials/CA on its own. The exact assigned Aiven endpoints and public Render/Vercel URLs must replace the placeholders above.

Useful provider documentation: [Aiven MySQL Free tier](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier), [Aiven command-line connection](https://aiven.io/docs/products/mysql/howto/connect-from-cli), [Aiven MySQL version management](https://aiven.io/docs/products/mysql/howto/manage-mysql-version), [Prisma MySQL TLS URL parameters](https://docs.prisma.io/docs/orm/v6/overview/databases/mysql), [Render Free limitations](https://render.com/docs/free), [Render secret files](https://render.com/docs/configure-environment-variables), [Vercel monorepos](https://vercel.com/docs/monorepos), and [Vercel Hobby plan](https://vercel.com/docs/plans/hobby).
