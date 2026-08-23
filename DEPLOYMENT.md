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
```

If the managed MySQL provider requires TLS, include the provider's Prisma/MySQL
TLS URL parameters in `DATABASE_URL`.

The Render start command runs:

```bash
prisma migrate deploy && node dist/main
```

For a newly created demo database, run the demo seed once after migrations:

```bash
pnpm run seed:demo
```

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
- education options and digital library locations
- public registration page: `/register/lms-demo`

The seed is idempotent for its deterministic demo records. It does not reset the
database and does not delete non-demo organization data.
