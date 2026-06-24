# Architecture

## System Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend (Angular 22 — localhost:4200)"]
        A[App Component]
        H[Header Component]
        R[Router Outlet]
        T[Toast Component]

        subgraph Pages["Lazy-Loaded Pages"]
            Login[Login Page]
            Dashboard[Dashboard Page]
            Contacts[Contacts Page]
            ContactDetail[Contact Detail Page]
            Pipeline[Pipeline / Kanban Page]
            DealDetail[Deal Detail Page]
            NotFound[Not Found Page]
        end

        subgraph Services["Shared Services"]
            AuthSvc[Auth Service<br/>signal: currentUser]
            ContactsSvc[Contacts Service]
            DealsSvc[Deals Service]
            ActivitiesSvc[Activities Service]
            DashboardSvc[Dashboard Service]
            ToastSvc[Toast Service<br/>signal: toasts[]]
        end

        subgraph GuardsInterceptors["Auth Layer"]
            AuthGuard[Auth Guard<br/>route guard]
            AuthInterceptor[Auth Interceptor<br/>attaches JWT Bearer]
        end

        A --> H
        A --> R
        A --> T
        R --> Login
        R --> Dashboard
        R --> Contacts
        R --> ContactDetail
        R --> Pipeline
        R --> DealDetail
        R --> NotFound

        ContactsSvc --> AuthInterceptor
        DealsSvc --> AuthInterceptor
        ActivitiesSvc --> AuthInterceptor
        DashboardSvc --> AuthInterceptor
        AuthSvc --> AuthInterceptor
    end

    subgraph Backend["Backend (NestJS 11 — localhost:3000)"]
        direction TB
        B[AppModule]

        subgraph Modules["NestJS Modules"]
            AuthMod[AuthModule]
            ContactsMod[ContactsModule]
            DealsMod[DealsModule]
            ActivitiesMod[ActivitiesModule]
            DashboardMod[DashboardModule]
            SeedMod[SeedModule]
        end

        subgraph GuardsFilters["Cross-Cutting"]
            JwtGuard[JwtAuthGuard]
            PublicDec[Public Decorator]
            ExFilter[AllExceptionsFilter]
            Validation[Global ValidationPipe<br/>whitelist + transform]
        end

        subgraph Strategies["Auth Strategies"]
            JwtStrat[JwtStrategy<br/>ExtractJwt.fromAuthHeaderAsBearerToken]
        end

        subgraph Entities["TypeORM Entities"]
            OrgEntity[Organization]
            UserEntity[User]
            ContactEntity[Contact]
            DealEntity[Deal]
            ActivityEntity[Activity]
        end

        B --> AuthMod
        B --> ContactsMod
        B --> DealsMod
        B --> ActivitiesMod
        B --> DashboardMod
        B --> SeedMod

        ContactsMod --> ContactEntity
        DealsMod --> DealEntity
        ActivitiesMod --> ActivityEntity
        AuthMod --> OrgEntity
        AuthMod --> UserEntity

        AuthMod --> JwtStrat
        JwtStrat --> UserEntity
    end

    subgraph Database["Database (SQLite / PostgreSQL)"]
        DB[(crm.db)]
    end

    Frontend -- "HTTP requests (JWT Bearer token)" --> Backend
    Backend --> DB
    SeedMod --> DB
```

## Request Lifecycle

Below is the journey of a typical authenticated request (e.g. listing contacts for an organization):

```
Browser                           NestJS API
  │                                  │
  │  GET /api/contacts               │
  │  Authorization: Bearer <jwt>     │
  │─────────────────────────────────►│
  │                                  │
  │                       JwtAuthGuard (canActivate)
  │                         │
  │                         ▼
  │                   JwtStrategy.validate()
  │                   • Extracts token from header
  │                   • Verifies signature with JWT_SECRET
  │                   • Looks up user by payload.sub
  │                   • Returns { id, email, organizationId }
  │                         │
  │                         ▼
  │                   req.user = { id, email, organizationId }
  │                                  │
  │                   ContactsController.findAll(req, query)
  │                   • Reads req.user.organizationId
  │                   • Calls ContactsService.findAll(orgId, query)
  │                         │
  │                         ▼
  │                   ContactsService.findAll()
  │                   • Builds WHERE clause with organizationId
  │                   • Applies pagination (page/limit)
  │                   • Applies search filter (name LIKE %q%)
  │                   • Returns { data, total, page, totalPages }
  │                         │
  │◄─────────────────────────────────│
  │  HTTP 200                        │
  │  JSON response                   │
```

## Multi-Tenant Design Decisions

### How Tenant Isolation Works

The CRM uses **shared-database, shared-schema** multi-tenancy with **row-level isolation**. Every data table (`users`, `contacts`, `deals`, `activities`) has an `organizationId` foreign key column. Backend services receive `organizationId` from the authenticated JWT payload and inject it into every query's `WHERE` clause.

Key design points:

1. **`organizationId` is embedded in the JWT at login/register time.**
   The `AuthService` signs the JWT with `{ sub: userId, email, organizationId }`. This is the single source of truth for tenant identity — no URL-based tenant switches, no subdomain parsing.

2. **Every service method accepts `organizationId` as a parameter.**
   Controllers extract `req.user.organizationId` and pass it down to service methods. The service always includes `{ organizationId }` in its `FindOptionsWhere` clauses.

3. **TypeORM queries are scoped by `organizationId`.**
   Example from `ContactsService.findAll()`:
   ```typescript
   const where: FindOptionsWhere<Contact> = { organizationId };
   if (q) where.name = Like(`%${q}%`);
   const [data, total] = await this.contactRepository.findAndCount({ where, ... });
   ```

4. **There is no role-based access within a tenant yet.**
   Every user in an organization can see all data. Future work could layer row-level permissions on top (owner, admin, viewer roles).

5. **Registration atomically creates an org + admin user.**
   `AuthService.register()` creates an `Organization`, creates a `User` within that org, and signs a JWT — all in one operation. If user creation fails, the org is rolled back.

### Why Shared-Schema?

- **Simplicity:** No dynamic database creation or connection switching.
- **Low operational overhead:** One database, one connection pool.
- **Cross-tenant queries are impossible by design** — the `organizationId` column is always checked. Even if a rogue query tried to cross tenants, it would need to know another org's ID (not exposed in URLs or responses).
- **SQLite compatibility:** SQLite doesn't support multiple databases as easily as PostgreSQL schemas. Shared-schema with row-level isolation works on both engines.

## Why These Pieces Are Shaped This Way

### NestJS Modules as Domain Boundaries

Each domain (Auth, Contacts, Deals, Activities, Dashboard) is its own NestJS module with controller, service, DTOs, and entity. This follows NestJS convention and keeps concerns separated:

- **AuthModule** — handles registration, login, profile. Dependencies: `JwtModule`, `UsersService`, `TypeOrmModule.forFeature([Organization])`.
- **DashboardModule** — aggregates data from `DealsService` and `ActivitiesService`. It's a thin coordinator that composes data from other domains.
- **SeedModule** — `OnModuleInit` implementation that seeds demo data. Self-contained with all 5 repositories injected. Only runs when the database is empty.

### Angular Services as Thin HTTP Wrappers

Services are intentionally minimal — they wrap `HttpClient` calls, return `Observable` (which the component subscribes to and converts to signals), and do not maintain their own cache layer. State lives in component signals. This keeps the data flow simple:

1. Component calls service method → gets `Observable`
2. Component subscribes, `.subscribe()` callback calls `this.signal.set(result)`
3. Template reads signal → DOM updates automatically

### Signals Instead of NgRx/RxJS State Management

The project intentionally avoids NgRx, Elf, or Akita. Angular 22's signal APIs are sufficient for this scale:

- **Component-local signals** for all mutable UI state (loading, error, data, form visibility)
- **Service-level signals** only for cross-cutting state: `AuthService.currentUser` and `ToastService.toasts`
- **Computed signals** used in `PipelineChartComponent` for `maxValue` and `svgWidth` derived from input
- **No effects** needed — all side effects are explicit HTTP subscriptions

### Kanban Without Drag & Drop Libraries

The pipeline page implements drag-and-drop using the native HTML5 Drag & Drop API (`dragstart`, `dragover`, `drop` events) and a custom event bus (`window.dispatchEvent(new CustomEvent('deal-dropped', ...))`). This avoids a dependency on `@angular/cdk/drag-drop` or similar libraries. The trade-off: no touch support out of the box, and styling drag feedback is manual.

### SVG Bar Charts Without Chart Libraries

The `PipelineChartComponent` renders a bar chart using inline SVG `<rect>` elements. `computed()` signals derive `maxValue` and `svgWidth` from the input data, and `getBarHeight()` calculates proportional heights. This keeps the bundle small and avoids a Chart.js or D3 dependency for a single bar chart.
