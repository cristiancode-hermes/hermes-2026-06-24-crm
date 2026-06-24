# Multi-Tenant CRM

A lightweight, multi-tenant CRM for small businesses — manage contacts, track deals through a visual Kanban pipeline, log activities, and monitor performance from a dashboard.

---

## Features

- **Multi-tenant architecture** — each organization gets its own isolated data scope. Register an org, invite users, and every query is organization-scoped via the JWT token.
- **Contact management** — create, edit, search, paginate, and delete contacts. Search by name with `LIKE` queries; sort by any field.
- **Contact detail** — view full contact info, see related deals in a list, and browse a chronological activity timeline (calls, emails, meetings, notes).
- **Pipeline / Kanban** — 6-stage sales pipeline (Nuevo → Calificado → Propuesta → Negociación → Cerrado Ganado / Cerrado Perdido). Drag-and-drop deals between stages using raw HTML5 Drag & Drop API — no external libraries.
- **Deal management** — full CRUD for deals with value, expected close date, stage, and contact association. Stage changes update immediately.
- **Activity timeline** — log activities (call, email, meeting, note) tied to contacts or deals. Each activity carries a date, description, and type.
- **Dashboard** — KPI cards (total deals, pipeline value, won value, conversion rate), a bar chart of pipeline value by stage (hand-rolled SVG), recent activities feed, and upcoming deals closing within 7 days.
- **Authentication** — JWT-based auth with login and registration. Tokens carry the user's organization ID for automatic query scoping.
- **Swagger docs** — auto-generated API documentation at `/api/docs`.

## Stack

### Backend — `apps/api`

| Layer          | Technology                                                 |
| -------------- | ---------------------------------------------------------- |
| Runtime        | Node.js 22+, NestJS 11                                    |
| Language       | TypeScript 5.9+                                           |
| ORM            | TypeORM 1.0.0+                                            |
| Database       | SQLite via `better-sqlite3` (dev), PostgreSQL (prod-ready) |
| Auth           | Passport + `passport-jwt`, bcryptjs                        |
| Validation     | `class-validator` + `class-transformer`                    |
| API docs       | Swagger / OpenAPI via `@nestjs/swagger`                    |
| Config         | `@nestjs/config` with `.env` file                          |

### Frontend — `apps/web`

| Layer        | Technology                               |
| ------------ | ---------------------------------------- |
| Framework    | Angular 22                               |
| Change Detection | Zoneless (`provideZonelessChangeDetection`) |
| State       | Angular signals (no NgRx, no RxJS state) |
| Styling     | Tailwind CSS v4 with custom theme         |
| HTTP         | `HttpClient` with functional interceptors |
| Router       | Angular Router 22 with lazy-loaded pages |
| Charts       | Custom SVG (hand-rolled, no chart lib)   |
| Drag & Drop  | HTML5 native Drag & Drop API             |
| Testing      | Vitest                                   |

## Prerequisites

- **Node.js** 22+ (LTS recommended)
- **npm** 10+
- A terminal that can run two concurrent processes (or a way to run backend + frontend in separate windows)

## Local Setup

### 1. Clone and install

```bash
cd apps/api
npm install

cd ../web
npm install
```

### 2. Environment variables

Copy the example env file for the API:

```bash
cp ../../.env.example apps/api/.env
```

The defaults work out of the box for local development with SQLite. Key variables:

| Variable         | Default                       | Description                         |
| ---------------- | ----------------------------- | ----------------------------------- |
| `DATABASE_URL`   | `sqlite:///data/crm.db`       | SQLite database path                |
| `JWT_SECRET`     | `change-me-to-a-random-secret`| JWT signing secret                  |
| `JWT_EXPIRES_IN` | `7d`                          | Token expiration duration           |

For production, set `DATABASE_URL` to a PostgreSQL connection string and set `JWT_SECRET` to a strong random value.

### 3. Run the API

```bash
cd apps/api
npm run start:dev
```

The API starts on `http://localhost:3000`. Swagger docs at `http://localhost:3000/api/docs`.

On first launch, the seed module (`SeedService`) populates the database with demo data:
- 1 organization ("Acme Corporation")
- 1 admin user (admin@acme.com / dev-secret)
- 10 contacts
- 18 deals across all 6 stages
- 12 activities

### 4. Run the frontend

In a separate terminal:

```bash
cd apps/web
npm start
```

The frontend starts on `http://localhost:4200`.

### 5. Login

Navigate to `http://localhost:4200/login` and use:

- **Email:** `admin@acme.com`
- **Password:** `dev-secret`

Or register a new organization directly from the login page by toggling to registration mode.

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                   Frontend                        │
│            Angular 22 · Signals · Zoneless        │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │Dashboard │ │Contacts  │ │ Pipeline/Kanban  │  │
│  │  Page    │ │  Page    │ │     Page         │  │
│  └────┬─────┘ └────┬─────┘ └────────┬─────────┘  │
│       │            │                │             │
│       └────────────┴────────────────┘             │
│                      │ HTTP (JWT Bearer)          │
└──────────────────────┼───────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────┐
│          NestJS 11 API                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  Auth    │ │ Contacts │ │      Deals       │  │
│  │ Module   │ │  Module  │ │     Module       │  │
│  ├──────────┤ ├──────────┤ ├──────────────────┤  │
│  │Dashboard │ │Activities│ │      Seed        │  │
│  │ Module   │ │  Module  │ │     Module       │  │
│  └──────────┘ └──────────┘ └──────────────────┘  │
│                      │ TypeORM                    │
│                      ▼                            │
│              ┌──────────────┐                     │
│              │   SQLite /   │                     │
│              │  PostgreSQL  │                     │
│              └──────────────┘                     │
└──────────────────────────────────────────────────┘
```

### Request Flow

1. User authenticates via `POST /api/auth/login` (or registers via `POST /api/auth/register`).
2. Server returns a JWT containing `{ sub, email, organizationId }`.
3. Frontend stores the token in `localStorage` and attaches it as `Authorization: Bearer <token>` via the `authInterceptor`.
4. Every authenticated request includes the token. The `JwtStrategy` validates the token and attaches `organizationId` to `req.user`.
5. All service methods accept `organizationId` as a parameter and filter every query by it — ensuring true data isolation between tenants.
6. The frontend uses Angular signals to manage local component state. HTTP responses update signals, which trigger DOM updates without `zone.js`.

## Project Structure

```
2026-06-24-crm/
├── apps/
│   ├── api/                          # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/                 # Auth module
│   │   │   │   ├── dto/              # RegisterDto, LoginDto
│   │   │   │   └── strategies/       # JwtStrategy
│   │   │   ├── contacts/             # Contacts CRUD module
│   │   │   │   ├── dto/              # Create/Update DTOs
│   │   │   │   └── entities/         # Contact entity
│   │   │   ├── deals/                # Deals CRUD + Kanban module
│   │   │   │   ├── dto/              # Create/Update/Status DTOs
│   │   │   │   └── entities/         # Deal entity
│   │   │   ├── activities/           # Activities module
│   │   │   │   ├── dto/              # CreateActivityDto
│   │   │   │   └── entities/         # Activity entity
│   │   │   ├── dashboard/            # Dashboard aggregation module
│   │   │   ├── organizations/        # Organization entity + module
│   │   │   ├── users/                # User entity + service
│   │   │   ├── seed/                 # Database seeder
│   │   │   ├── common/               # Shared guards, filters, DTOs
│   │   │   └── config/               # Configuration loader
│   │   ├── migrations/               # SQL migration files
│   │   └── test/                     # E2E tests
│   └── web/                          # Angular frontend
│       └── src/
│           └── app/
│               ├── pages/            # Page components (lazy-loaded)
│               │   ├── login/
│               │   ├── dashboard/
│               │   ├── contacts/
│               │   ├── contact-detail/
│               │   ├── pipeline/
│               │   ├── deal-detail/
│               │   └── not-found/
│               └── shared/           # Shared services, models, guards, interceptors
├── docs/                             # Documentation
├── .env.example
└── README.md
```

## API Endpoints (21 total)

| Module      | Method | Path                     | Description                               |
| ----------- | ------ | ------------------------ | ----------------------------------------- |
| Auth        | POST   | `/api/auth/register`     | Register new organization + admin user    |
| Auth        | POST   | `/api/auth/login`        | Login with email and password             |
| Auth        | GET    | `/api/auth/profile`      | Get current user profile                  |
| Contacts    | GET    | `/api/contacts`          | List contacts (paginated, searchable)     |
| Contacts    | GET    | `/api/contacts/:id`      | Get single contact with deals & activities|
| Contacts    | POST   | `/api/contacts`          | Create a new contact                      |
| Contacts    | PUT    | `/api/contacts/:id`      | Update a contact                          |
| Contacts    | DELETE | `/api/contacts/:id`      | Delete a contact                          |
| Deals       | GET    | `/api/deals`             | List deals (filterable by stage, contact) |
| Deals       | GET    | `/api/deals/kpi`         | Get pipeline KPI data                     |
| Deals       | GET    | `/api/deals/upcoming`    | Get deals closing in next 7 days          |
| Deals       | GET    | `/api/deals/:id`         | Get single deal with contact & activities |
| Deals       | POST   | `/api/deals`             | Create a new deal                         |
| Deals       | PUT    | `/api/deals/:id`         | Update a deal                             |
| Deals       | DELETE | `/api/deals/:id`         | Delete a deal                             |
| Deals       | PATCH  | `/api/deals/:id/status`  | Update deal stage (drag-and-drop)         |
| Activities  | GET    | `/api/activities`        | List activities (filterable)              |
| Activities  | GET    | `/api/activities/:id`    | Get single activity                       |
| Activities  | POST   | `/api/activities`        | Create a new activity                     |
| Activities  | DELETE | `/api/activities/:id`    | Delete an activity                        |
| Dashboard   | GET    | `/api/dashboard`         | Get complete dashboard data               |

## Roadmap

- [x] Multi-tenant auth with JWT
- [x] Contact CRUD with search and pagination
- [x] Deal management with Kanban pipeline
- [x] Activity timeline
- [x] Dashboard with KPIs and SVG chart
- [x] Seed data for demo
- [x] Swagger documentation
- [ ] PostgreSQL adapter for production
- [ ] Row-level role permissions (admin / manager / viewer)
- [ ] Email notifications on deal stage changes
- [ ] File uploads for contact attachments
- [ ] CSV import/export for contacts and deals
- [ ] Dark mode persistence preference
- [ ] E2E test suite with Playwright
