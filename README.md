# Zorvyn Finance Backend

Production-oriented backend for a finance dashboard:
- Node.js + TypeScript
- Express
- PostgreSQL + Prisma ORM
- JWT auth + centralized RBAC
- Zod validation

## Prerequisites

1. PostgreSQL running (update `DATABASE_URL`)
2. Node.js 18+

## Environment

Copy `.env.example` to `.env` and update at least `DATABASE_URL` and `JWT_SECRET`.

## Setup

```bash
npm install
npm run prisma:generate
```

Run migrations against your Postgres instance:

```bash
npm run prisma:migrate:dev
```

Seed example data:

```bash
npm run prisma:seed
```

## RBAC

Permissions are permission-driven (no scattered role checks).

- `VIEWER` can: `records:read`, `dashboard:read`
- `ANALYST` can: `records:read`, `dashboard:read`, `insights:read`
- `ADMIN` can: `records:read`, `records:write`, `records:delete`, `dashboard:read`, `insights:read`, `users:manage`

## Auth

JWT is issued from `POST /auth/login`.

All protected endpoints require:
`Authorization: Bearer <token>`

## API

### Auth

`POST /auth/login`

Example request:
```bash
curl -s http://localhost:3000/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"admin@zorvyn.finance","password":"Admin123!"}'
```

Example response:
```json
{ "token": "eyJhbGciOi..." }
```

### Admin user management

`POST /admin/users` (ADMIN)

```bash
curl -s http://localhost:3000/admin/users \
  -H "content-type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"email":"new@zorvyn.finance","password":"Passw0rd!","role":"VIEWER","status":"ACTIVE"}'
```

### Records

`GET /records?type=INCOME&category=Salary&startDate=2026-01-01&endDate=2026-12-31&limit=20&offset=0`

Example response:
```json
{
  "items": [
    {
      "id": "clrzx8...",
      "amount": 1200.5,
      "type": "INCOME",
      "category": "Salary",
      "date": "2026-03-20T00:00:00.000Z",
      "notes": null,
      "createdAt": "2026-03-21T10:00:00.000Z"
    }
  ],
  "pagination": { "limit": 20, "offset": 0, "hasMore": false }
}
```

`POST /records` (ADMIN)

```bash
curl -s http://localhost:3000/records \
  -H "content-type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"amount":100,"type":"EXPENSE","category":"Food","date":"2026-04-01","notes":"Lunch"}'
```

### Dashboard

`GET /dashboard/summary` (VIEWER/ANALYST/ADMIN)

Example response:
```json
{
  "totalIncome": 12000.5,
  "totalExpense": 5300.0,
  "netBalance": 6700.5,
  "categoryBreakdown": {
    "income": [{ "category": "Salary", "total": 10000.0 }],
    "expense": [{ "category": "Rent", "total": 1500.0 }]
  },
  "recentTransactions": [
    {
      "id": "clrzx8...",
      "amount": 1200.0,
      "type": "INCOME",
      "category": "Salary",
      "date": "2026-03-20T00:00:00.000Z",
      "notes": null,
      "createdAt": "2026-03-21T10:00:00.000Z"
    }
  ],
  "monthlyTrends": [
    { "month": "2026-01", "income": 4000.0, "expense": 2500.0 }
  ]
}
```

For `VIEWER`, `categoryBreakdown` and `monthlyTrends` are returned as empty arrays (they require `insights:read`).

