# Database Schema

## ER Diagram

```mermaid
erDiagram
    Organization ||--o{ User : "has"
    Organization ||--o{ Contact : "has"
    Organization ||--o{ Deal : "has"
    Organization ||--o{ Activity : "has"
    Contact ||--o{ Deal : "has"
    Contact ||--o{ Activity : "has"
    Deal ||--o{ Activity : "has"

    Organization {
        int id PK
        text name
        text slug UK
        datetime createdAt
        datetime updatedAt
    }

    User {
        int id PK
        text name
        text email UK
        text passwordHash
        text role "default: 'admin'"
        int organizationId FK
        datetime createdAt
    }

    Contact {
        int id PK
        text name
        text email
        text phone "nullable"
        text company "nullable"
        text role "nullable"
        text notes "nullable"
        int organizationId FK
        datetime createdAt
        datetime updatedAt
    }

    Deal {
        int id PK
        text name
        real value "default: 0"
        text stage "default: 'Nuevo'"
        int position "default: 0"
        date expectedCloseDate "nullable"
        text notes "nullable"
        int contactId FK
        int organizationId FK
        datetime createdAt
        datetime updatedAt
    }

    Activity {
        int id PK
        text type "note|call|email|meeting"
        text description
        text date "the activity date"
        int contactId FK "nullable"
        int dealId FK "nullable"
        int organizationId FK
        datetime createdAt
    }
```

## Entities

### Organization

The tenant boundary. Every piece of data belongs to exactly one organization.

| Column       | Type       | Constraints      | Notes                          |
| ------------ | ---------- | ---------------- | ------------------------------ |
| `id`         | `INTEGER`  | `PK`             | Auto-increment                 |
| `name`       | `TEXT`     | `NOT NULL`       | Display name                   |
| `slug`       | `TEXT`     | `UNIQUE NOT NULL`| URL-safe identifier, e.g. `acme-corp` |
| `createdAt`  | `DATETIME` | `NOT NULL`       | Auto-set                       |
| `updatedAt`  | `DATETIME` | `NOT NULL`       | Auto-set                       |

**Relationships:**
- `users` — One-to-Many with `User`
- `contacts` — One-to-Many with `Contact`
- `deals` — One-to-Many with `Deal`
- `activities` — One-to-Many with `Activity`

### User

Users belong to organizations. Currently all users get the `admin` role; role-based permissions are future work.

| Column           | Type       | Constraints       | Notes                          |
| ---------------- | ---------- | ----------------- | ------------------------------ |
| `id`             | `INTEGER`  | `PK`              | Auto-increment                 |
| `name`           | `TEXT`     | `NOT NULL`        | Display name                   |
| `email`          | `TEXT`     | `UNIQUE NOT NULL` | Login identifier, global unique |
| `passwordHash`   | `TEXT`     | `NOT NULL`        | bcrypt hash, 10 rounds         |
| `role`           | `TEXT`     | `NOT NULL`        | Default `'admin'`              |
| `organizationId` | `INTEGER`  | `FK NOT NULL`     | References `organizations.id`  |
| `createdAt`      | `DATETIME` | `NOT NULL`        | Auto-set                       |

**Relationships:**
- `organization` — Many-to-One with `Organization`

### Contact

A person associated with an organization. Can have multiple deals and activities.

| Column           | Type       | Constraints        | Notes                          |
| ---------------- | ---------- | ------------------ | ------------------------------ |
| `id`             | `INTEGER`  | `PK`               | Auto-increment                 |
| `name`           | `TEXT`     | `NOT NULL`         | Display name                   |
| `email`          | `TEXT`     | `NOT NULL`         | Contact email (not unique — multiple contacts may share company email) |
| `phone`          | `TEXT`     | `NULLABLE`         | Phone number                   |
| `company`        | `TEXT`     | `NULLABLE`         | Company name                   |
| `role`           | `TEXT`     | `NULLABLE`         | Job title                      |
| `notes`          | `TEXT`     | `NULLABLE`         | Free text notes                |
| `organizationId` | `INTEGER`  | `FK NOT NULL`      | References `organizations.id`  |
| `createdAt`      | `DATETIME` | `NOT NULL`         | Auto-set                       |
| `updatedAt`      | `DATETIME` | `NOT NULL`         | Auto-set                       |

**Relationships:**
- `organization` — Many-to-One with `Organization`
- `deals` — One-to-Many with `Deal`
- `activities` — One-to-Many with `Activity`

### Deal

A sales opportunity in one of 6 stages. The Kanban board is organized by `stage`, and cards are ordered by `position` within each stage.

| Column              | Type       | Constraints        | Notes                          |
| ------------------- | ---------- | ------------------ | ------------------------------ |
| `id`                | `INTEGER`  | `PK`               | Auto-increment                 |
| `name`              | `TEXT`     | `NOT NULL`         | Deal name                      |
| `value`             | `REAL`     | `DEFAULT 0`        | Monetary amount                |
| `stage`             | `TEXT`     | `DEFAULT 'Nuevo'`  | Pipeline stage (see stages below) |
| `position`          | `INTEGER`  | `DEFAULT 0`        | Sort order within stage        |
| `expectedCloseDate` | `DATE`     | `NULLABLE`         | Target close date (ISO string) |
| `notes`             | `TEXT`     | `NULLABLE`         | Free text notes                |
| `contactId`         | `INTEGER`  | `FK NOT NULL`      | References `contacts.id`       |
| `organizationId`    | `INTEGER`  | `FK NOT NULL`      | References `organizations.id`  |
| `createdAt`         | `DATETIME` | `NOT NULL`         | Auto-set                       |
| `updatedAt`         | `DATETIME` | `NOT NULL`         | Auto-set                       |

**Pipeline Stages:**
1. `Nuevo` — New lead
2. `Calificado` — Qualified
3. `Propuesta` — Proposal sent
4. `Negociación` — Negotiation
5. `Cerrado Ganado` — Won
6. `Cerrado Perdido` — Lost

**Relationships:**
- `organization` — Many-to-One with `Organization`
- `contact` — Many-to-One with `Contact`
- `activities` — One-to-Many with `Activity`

### Activity

A logged interaction (call, email, meeting, note) related to a contact or deal.

| Column           | Type       | Constraints         | Notes                          |
| ---------------- | ---------- | ------------------- | ------------------------------ |
| `id`             | `INTEGER`  | `PK`                | Auto-increment                 |
| `type`           | `TEXT`     | `NOT NULL CHECK(...)`| One of: `note`, `call`, `email`, `meeting` |
| `description`    | `TEXT`     | `NOT NULL`          | Free text description          |
| `date`           | `DATE`     | `NOT NULL`          | The date the activity occurred (not the creation date) |
| `contactId`      | `INTEGER`  | `FK NULLABLE`       | References `contacts.id`       |
| `dealId`         | `INTEGER`  | `FK NULLABLE`       | References `deals.id`          |
| `organizationId` | `INTEGER`  | `FK NOT NULL`       | References `organizations.id`  |
| `createdAt`      | `DATETIME` | `NOT NULL`          | Auto-set, record creation time |

**Relationships:**
- `organization` — Many-to-One with `Organization`
- `contact` — Many-to-One with `Contact` (nullable)
- `deal` — Many-to-One with `Deal` (nullable)

## Indexes

Defined in `migrations/001-initial-schema.sql`:

| Index Name                         | Table        | Columns                                  | Purpose                                           |
| ---------------------------------- | ------------ | ---------------------------------------- | ------------------------------------------------- |
| `idx_users_organization`           | `users`      | `organizationId`                         | Fast lookup of users by tenant                     |
| `idx_contacts_organization`        | `contacts`   | `organizationId`                         | Multi-tenant query scoping                         |
| `idx_contacts_org_name`            | `contacts`   | `organizationId, name`                   | Multi-tenant + name search (LIKE `%q%` still scans, but narrows by org) |
| `idx_contacts_org_email`           | `contacts`   | `organizationId, email`                  | Multi-tenant + email lookup                        |
| `idx_deals_org_stage`              | `deals`      | `organizationId, stage`                  | Kanban board: filter by org + stage                |
| `idx_deals_org_stage_pos`          | `deals`      | `organizationId, stage, position`        | Kanban ordering within stage                       |
| `idx_deals_org_contact`            | `deals`      | `organizationId, contactId`              | Find deals for a specific contact (tenant-safe)    |
| `idx_deals_close_date`             | `deals`      | `expectedCloseDate`                      | Upcoming deals query — scans all tenants but fast for small datasets |
| `idx_activities_org_contact`       | `activities` | `organizationId, contactId`              | Filter activities by contact (tenant-safe)         |
| `idx_activities_org_deal`          | `activities` | `organizationId, dealId`                 | Filter activities by deal (tenant-safe)            |
| `idx_activities_org_date`          | `activities` | `organizationId, date`                   | Time-ordered activity listing                      |
| `idx_activities_org_contact_date`  | `activities` | `organizationId, contactId, date`        | Contact timeline sorted by date                    |

## Migration Strategy

### Current Approach (Dev)

TypeORM's `synchronize: true` is enabled in `app.module.ts`. This auto-creates tables from entity class metadata on every application startup. Suitable for local development and prototyping but **not for production**.

### Production Migration Plan

1. **Disable `synchronize`** in production by setting it to `false` in the config.
2. **Use the provided migration file** `migrations/001-initial-schema.sql` as the base schema. This file is PostgreSQL-compatible and creates all tables, constraints, and indexes.
3. **Run migrations manually** or via a migration runner (TypeORM migrations can be generated with `typeorm migration:create`).
4. When switching to PostgreSQL, ensure:
   - The `TypeOrmModule` config in `app.module.ts` changes to `type: 'postgres'`.
   - The `Configuration` loader reads `DATABASE_URL` as a PostgreSQL connection string.
   - `synchronize` is `false` and a proper migration process is in place.

### Switching from SQLite to PostgreSQL

The `.env.example` shows the path:

```env
# SQLite (dev)
DATABASE_URL=sqlite:///data/crm.db

# PostgreSQL (production)
# DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/crm-db
# USE_POSTGRES=true
```

The configuration module can detect `USE_POSTGRES` or the `DATABASE_URL` prefix and switch the `type` field accordingly. The entities are identical — only the column type mappings differ, and TypeORM handles that.
