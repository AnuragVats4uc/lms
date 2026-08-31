# LMS Demo Deployment Runbook

This repository is deployed as two services from the `main` branch:

```text
GitHub main
├── frontend/apps/web -> Vercel
└── backend -> Render -> MySQL database
```

Use a fresh MySQL database for the client demo. Do not import an old LMS
database, and do not reset an unidentified database.

## Backend

Render uses `render.yaml`.

Required environment variables:

```dotenv
NODE_ENV=production
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/lms_demo?connection_limit=5
FRONTEND_URL=https://YOUR_FRONTEND_DOMAIN
PUBLIC_API_URL=https://YOUR_BACKEND_DOMAIN
JWT_ACCESS_SECRET=<unique random secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<different unique random secret>
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
ACTIVITY_RETENTION_WORKER_ENABLED=true
STORAGE_PROVIDER=utho_s3
UTHO_S3_ENDPOINT=https://YOUR_UTHO_OBJECT_STORAGE_ENDPOINT
UTHO_S3_REGION=YOUR_UTHO_REGION
UTHO_S3_BUCKET=YOUR_PRIVATE_BUCKET
UTHO_S3_ACCESS_KEY=<backend-only access key>
UTHO_S3_SECRET_KEY=<backend-only secret key>
UTHO_S3_FORCE_PATH_STYLE=true
UTHO_S3_MAX_UPLOAD_BYTES=26214400
```

If the managed MySQL provider requires TLS, include the provider's Prisma/MySQL
TLS URL parameters in `DATABASE_URL`.

The Render start command runs:

```bash
prisma migrate deploy && node dist/main.js
```

### Utho object storage rollout

The bucket must be private. Do not add Utho access keys, secret keys, bucket
credentials, or direct object URLs to Vercel/frontend variables. Browsers upload
and download through authenticated backend APIs. The Utho key must be allowed to
read, create, and delete objects in the configured bucket and to perform the
bucket health check.

Managed object keys contain both readable numeric IDs and UUIDs, for example:

```text
organizations/12/<organization-uuid>/resources/34/<resource-uuid>/assets/56/<asset-uuid>/notes.pdf
```

Use this rollout order for an existing environment:

1. Back up MySQL and preserve the current `backend/uploads` directory.
2. Configure the Utho variables above on the backend only.
3. Link the access key to the bucket with read/write/delete permission, then run
   both storage checks from the backend directory:

   ```bash
   pnpm run verify:utho-storage
   pnpm run verify:utho-storage -- --probe-object-access
   ```

   The second command uploads, reads, and deletes one uniquely named verification
   object. It never lists, replaces, or deletes an application object.
4. Run `prisma migrate deploy`. This adds `stored_objects` and nullable object
   references; it does not remove UUIDs or legacy URL/path columns.
5. Deploy the backend and verify `GET /api/v1/health/storage` returns a ready
   `utho_s3` provider.
6. From the backend directory, inventory eligible legacy files without writing:

   ```bash
   pnpm run backfill:utho-storage
   ```

7. Review eligible, skipped, and missing counts. Resolve missing-file entries,
   then perform the resumable migration:

   ```bash
   pnpm run backfill:utho-storage -- --apply
   ```

8. Verify student, teacher, and admin document viewing, student avatar upload,
   and a Word/Excel exam import. Keep the local uploads backup until these checks
   and an object-count audit pass.
9. Redeploy the frontend after the backend is healthy. The frontend needs only
   `NEXT_PUBLIC_API_URL`; no Utho setting is required.

The backfill skips rows already linked to a stored object and cleans up a newly
uploaded object if its database link fails. New uploads are switched atomically;
legacy local resource reads remain available during the migration. Do not delete
the local upload backup as part of the deployment command.

For rollback, restore the pre-deployment database backup together with its
matching `backend/uploads` copy before deploying an application version that
predates managed storage. Merely removing Utho variables is not a complete
rollback for records already migrated to Utho.

For a newly created demo database, run the demo seed once after migrations:

```bash
pnpm run seed:demo
```

### Student activity retention

The backend enforces each organization's activity and failed-login retention
policy once per day. Cleanup is batched, never deletes open sessions, and also
processes authentication attempts that could not be matched to an organization.
Successful student report views and exports are written to the activity audit
timeline with the staff actor, role, selected filters, and export format.

Set `ACTIVITY_RETENTION_WORKER_ENABLED=true` on exactly one backend instance. If
the backend is horizontally scaled, set it to `false` on every other instance to
avoid duplicate maintenance work.

After the activity migration is deployed, an operator can perform the first
cleanup immediately from the backend directory:

```bash
pnpm run maintenance:activity-retention
```

The command prints the number of records removed from authentication attempts,
login sessions, resource sessions, and activity events. Review the configured
organization retention policies before running it against an existing database.

## Frontend

Vercel uses `frontend/apps/web/vercel.json`.

Required production environment variable:

```dotenv
NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_DOMAIN/api/v1
```

This value is embedded at build time, so redeploy the frontend after changing it.

## Demo Data

The dedicated demo seed creates:

- one organization: `LMS-DEMO`
- one academic session: `AY-2026-27`
- one course: `COMP-EXAM-DEMO`
- one published session course
- Admin, Teacher, Counselor, and Student demo accounts
- one real student enrollment and course enrollment
- folders and resources for all supported resource types: `DOCUMENT`, `VIDEO`, `EXAM`
- one minimal valid exam graph
- comprehensive student activity history covering authentication failures,
  session endings, document pages, video actions, exam outcomes, concurrent
  devices/tabs, report audits, and every resource termination reason
- education options and digital library locations
- public registration page: `/register/lms-demo`

The seed is idempotent for its deterministic demo records. It does not reset the
database and does not delete non-demo organization data.

To print the demo student's report routes and verify that every activity
scenario is present:

```bash
pnpm run verify:demo-activity
```
