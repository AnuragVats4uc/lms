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
```

If the managed MySQL provider requires TLS, include the provider's Prisma/MySQL
TLS URL parameters in `DATABASE_URL`.

The Render start command runs:

```bash
prisma migrate deploy && node dist/src/main
```

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
