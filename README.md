# Zorvyn Finance Backend

A production-oriented backend for a finance dashboard system with role-based access control, financial record management, and analytical APIs.

---

## 🧱 Tech Stack

* **Runtime:** Node.js + TypeScript
* **Framework:** Express
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Authentication:** JWT
* **Validation:** Zod
* **Architecture:** Modular + layered (Controller → Service → Data)

---

## ⚙️ Setup Instructions

### Prerequisites

* Node.js (v18+)
* PostgreSQL running locally or remotely

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=your_secret_key_min_16_chars
```

---

### Install & Run

```bash
npm install
npm run prisma:generate
npx prisma db push
npm run prisma:seed
npm run dev
```

---

### Production

```bash
npm run build
npm start
```

---

## 🔐 Authentication

* JWT-based authentication

* Token issued via:

  ```http
  POST /auth/login
  ```

* Required header for protected routes:

  ```http
  Authorization: Bearer <token>
  ```

* JWT Payload includes:

  * `sub` (user id)
  * `role`
  * `email`

---

## 👥 Role-Based Access Control (RBAC)

Permission-driven design (centralized middleware).

| Role    | Permissions                              |
| ------- | ---------------------------------------- |
| VIEWER  | records:read, dashboard:read             |
| ANALYST | VIEWER + insights:read                   |
| ADMIN   | Full access (records + users management) |

### Key Design Choice

* No scattered role checks
* All access enforced via **central RBAC middleware**

---

## 📊 Core Features

### 1. User Management (Admin Only)

* Create users
* Update role/status
* Activate/Deactivate users

---

### 2. Financial Records

* CRUD operations
* Per-user data isolation (`userId` scoped)
* Filtering support:

  * type (INCOME / EXPENSE)
  * category
  * date range
* Pagination:

  * `limit` (1–100)
  * `offset`

---

### 3. Dashboard APIs

`GET /dashboard/summary`

Returns:

* Total income
* Total expenses
* Net balance
* Category breakdown
* Recent transactions
* Monthly trends

### Permission-aware Response

* VIEWER → limited data (no insights)
* ANALYST/ADMIN → full analytics

---

## 📡 API Overview

### Auth

```http
POST /auth/login
```

---

### Users (Admin)

```http
POST   /admin/users
PATCH  /admin/users/:id/role
PATCH  /admin/users/:id/status
POST   /admin/users/:id/activate
POST   /admin/users/:id/deactivate
```

---

### Records

```http
GET    /records
GET    /records/:id
POST   /records        (ADMIN)
PATCH  /records/:id    (ADMIN)
DELETE /records/:id    (ADMIN)
```

---

### Dashboard

```http
GET /dashboard/summary
```

---

## 🧠 Key Design Decisions

### 1. Per-user Data Isolation

Each financial record is tied to a user via `userId`.

👉 Prevents cross-user data leaks
👉 Simplifies RBAC enforcement

---

### 2. Soft Delete Strategy

* Uses `deletedAt`
* Deleted records are excluded from reads

---

### 3. Aggregation Strategy

Dashboard uses optimized queries:

* Prisma `aggregate` for totals
* Prisma `groupBy` for categories
* Raw SQL (`date_trunc`) for monthly trends

👉 Tradeoff:

* Raw SQL used for better performance and flexibility

---

### 4. Pagination Approach

* Offset-based pagination for simplicity
* Future improvement: cursor-based pagination

---

## ⚠️ Error Handling

| Code | Meaning          |
| ---- | ---------------- |
| 400  | Validation error |
| 401  | Unauthorized     |
| 403  | Forbidden        |
| 404  | Not found        |
| 500  | Server error     |

---

## 📁 Project Structure

```bash
src/
 ├── modules/
 │    ├── user/
 │    ├── finance/
 │    ├── dashboard/
 ├── middleware/
 │    ├── auth.middleware.ts
 │    ├── rbac.middleware.ts
 │    ├── error.middleware.ts
 ├── utils/
 ├── app.ts
 ├── server.ts
```

---

## 📌 Assumptions

* Single-tenant system
* Users access only their own data
* Admin has global visibility
* No rate limiting implemented (can be added)

---

## 🚀 Future Improvements

* Rate limiting / brute-force protection
* Refresh token mechanism
* Cursor-based pagination
* Audit logging
* Multi-tenant support (organizations)

---

## 🧪 Seeded Users

| Role    | Email                                                   | Password    |
| ------- | ------------------------------------------------------- | ----------- |
| ADMIN   | [admin@zorvyn.finance](mailto:admin@zorvyn.finance)     | Admin123!   |
| ANALYST | [analyst@zorvyn.finance](mailto:analyst@zorvyn.finance) | Analyst123! |
| VIEWER  | [viewer@zorvyn.finance](mailto:viewer@zorvyn.finance)   | Viewer123!  |

---

## 🎯 Summary

This backend demonstrates:

* Clean architecture (modular + layered)
* Strong RBAC implementation
* Efficient aggregation queries
* Scalable and maintainable design

---
