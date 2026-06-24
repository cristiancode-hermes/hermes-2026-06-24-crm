# Architecture Decision Records

## ADR-001: Multi-Tenancy via Organization-Scoped Queries

**Status:** Accepted  
**Date:** 2026-06-24  
**Driver:** Need to support multiple small businesses (tenants) with complete data isolation.

### Context

The CRM must serve multiple organizations. Each organization's data (contacts, deals, activities) must be invisible to all other organizations. Three approaches were considered:

1. **Database-per-tenant** — each org gets its own SQLite file or PostgreSQL database.
2. **Schema-per-tenant** — same database, separate PostgreSQL schemas (e.g. `org_1.contacts`, `org_2.contacts`).
3. **Shared-database, shared-schema** — all data lives in one set of tables, with row-level ownership via an `organizationId` column.

### Decision

Use **shared-database, shared-schema** with row-level isolation via an `organizationId` foreign key on every tenant-scoped table.

### Consequences

- **Positive:** Simple to implement and test. Works identically on SQLite and PostgreSQL. One connection pool, one set of migrations. No dynamic schema creation.
- **Positive:** The `organizationId` is embedded in the JWT at login time and automatically applied to every query — no risk of accidentally exposing cross-tenant data.
- **Negative:** A bug that omits the `organizationId` filter would leak data across tenants. Mitigated by: (a) every `findAll`/`findOne` service method explicitly takes `organizationId`, (b) code review enforces scoping, (c) the seed module also scopes by org.
- **Negative:** Cannot use SQLite for production at scale — SQLite doesn't handle concurrent writes well. PostgreSQL is the production target.

---

## ADR-002: SQLite for Development, PostgreSQL for Production

**Status:** Accepted  
**Date:** 2026-06-24  
**Driver:** Zero-dependency local development vs production-scale needs.

### Context

The project needed a database that works immediately after `npm install` without Docker, cloud accounts, or system dependencies.

### Decision

Use `better-sqlite3` (synchronous SQLite driver for Node.js) during development, with a migration path to PostgreSQL for production.

### Consequences

- **Positive:** `npm install` is the only setup step. No PostgreSQL server, no Docker Compose, no cloud account.
- **Positive:** TypeORM abstracts the difference — the same entities, same queries, same repository patterns work on both engines.
- **Positive:** The `.env.example` documents both configurations, making the switch clear.
- **Negative:** Certain PostgreSQL features are unavailable in dev (e.g. full-text search, `RETURNING` with updates). The migration SQL file (`001-initial-schema.sql`) is written in a compatible dialect with both engines in mind.
- **Negative:** `synchronize: true` in dev means schema drift is possible if entities and migration files get out of sync. A production deployment must disable `synchronize` and use proper migrations.

---

## ADR-003: Kanban Drag-and-Drop with Native HTML5 API

**Status:** Accepted  
**Date:** 2026-06-24  
**Driver:** Avoid external drag-and-drop library dependency for a single Kanban board.

### Context

The pipeline page needs drag-and-drop to move deals between stages. Options considered:

1. **`@angular/cdk/drag-drop`** — Angular CDK's built-in drag-and-drop module. Standard choice but adds a dependency.
2. **`dnd-kit` / `sortablejs`** — Third-party libraries.
3. **Native HTML5 Drag & Drop API** — `dragstart`, `dragover`, `drop` events — zero dependencies.

### Decision

Use the **native HTML5 Drag & Drop API** with a custom event bus (`CustomEvent`) to communicate between `DealCardComponent` (source) and `KanbanColumnComponent` (target).

### Consequences

- **Positive:** Zero additional dependencies. The implementation is ~40 lines of TypeScript across 3 components.
- **Positive:** Works on desktop. Lightweight.
- **Negative:** No touch/mobile support without additional polyfills. HTML5 DnD has inconsistent styling support across browsers (drag ghost images render differently).
- **Negative:** The custom event bus (`window.dispatchEvent`) is an implicit coupling — the `KanbanBoardComponent` listens for `deal-dropped` events dispatched by `KanbanColumnComponent`. This works but is less discoverable than a shared service or input/output bindings.

---

## ADR-004: Tailwind CSS v4 with Custom Theme

**Status:** Accepted  
**Date:** 2026-06-24  
**Driver:** Rapid UI development with a consistent design system.

### Context

The frontend needed a styling framework that enables fast iteration without writing custom CSS for every component. The designer specified a blue-primary / purple-secondary / yellow-accent palette.

### Decision

Use **Tailwind CSS v4** with a custom `@theme` block defining the brand palette, fonts (Inter + JetBrains Mono), shadows, and border radii. The v4 import syntax (`@import "tailwindcss"`) and `@custom-variant dark` are used.

### Consequences

- **Positive:** Zero runtime CSS — Tailwind purges unused styles during the Angular build. Small production CSS bundle.
- **Positive:** The custom theme tokens (`bg-primary-500`, `text-neutral-700`) are consistent across all 37 components.
- **Positive:** Dark mode is implemented via the `.dark` variant, toggled by a class on `<html>`.
- **Positive:** Tailwind v4's `@theme` and `@import` are significantly cleaner than v3's Tailwind config file.
- **Negative:** Tailwind v4 is very new (released 2025). Fewer community resources and component libraries target v4 compared to v3. The PostCSS plugin (`@tailwindcss/postcss`) is required.
- **Negative:** No BEM-style component encapsulation — utility classes inline in templates can make HTML verbose. The trade-off is accepted for this project's size.

---

## ADR-005: JWT Authentication Strategy

**Status:** Accepted  
**Date:** 2026-06-24  
**Driver:** Stateless authentication that carries tenant identity.

### Context

The API needs authentication that is stateless (no session store) and carries the user's `organizationId` for multi-tenant query scoping.

### Decision

Use **JWT tokens** issued at login/register, validated on every request via `passport-jwt` with a custom `JwtStrategy`.

### Consequences

- **Positive:** The JWT payload contains `{ sub, email, organizationId }` — the `organizationId` is directly available in every controller without a database lookup on every request.
- **Positive:** Stateless — no Redis session store, no database session tables. Scales horizontally trivially.
- **Positive:** Passport.js integration with NestJS is standard and well-documented.
- **Negative:** Token revocation requires a blocklist or short expiry. Current expiry is 7 days with no refresh token mechanism. A future iteration should add refresh tokens and a token blocklist.
- **Negative:** The `@Public()` decorator is manually implemented via a reflector — NestJS doesn't ship a built-in public route bypass for global auth guards.

---

## ADR-006: Angular Signals Architecture (No NgRx)

**Status:** Accepted  
**Date:** 2026-06-24  
**Driver:** Simpler state management for a medium-complexity SPA.

### Context

The Angular frontend has ~37 components across 6 pages. State management options considered:

1. **NgRx** — full Redux-style store. Overkill for this scope.
2. **RxJS + BehaviorSubjects** — traditional Angular service state.
3. **Angular Signals** — Angular 22's new reactive primitive.

### Decision

Use **Angular signals** for all state management. Component-local signals for page state (data, loading, error, UI toggles). Service-level signals only for cross-cutting state (`AuthService.currentUser`, `ToastService.toasts`). No NgRx, no RxJS-based state containers.

### Consequences

- **Positive:** Dramatically less boilerplate than NgRx. A component's entire state is a few `signal()` declarations and `set()` calls in subscriptions.
- **Positive:** Signals work seamlessly with Angular's zoneless change detection (see ADR-007).
- **Positive:** `computed()` signals (used in `PipelineChartComponent` and `PipelineValueBarComponent`) derive values lazily and efficiently.
- **Negative:** State is not centralized — debugging requires inspecting individual component instances. For this project's size that's acceptable.
- **Negative:** No devtools equivalent to Redux DevTools for signals. Debugging is limited to `console.log` or Angular DevTools component inspector.

---

## ADR-007: Zoneless Change Detection

**Status:** Accepted  
**Date:** 2026-06-24  
**Driver:** Reduce bundle size and eliminate unnecessary change detection cycles.

### Context

Angular's zone.js-based change detection runs change detection on every async operation (HTTP response, timer, event). For a signal-based application, zone.js adds overhead without benefit — signals already notify Angular when values change.

### Decision

Enable **`provideZonelessChangeDetection()`** in `app.config.ts`. Remove `zone.js` from the project dependencies.

### Consequences

- **Positive:** Smaller bundle — no `zone.js` runtime (~20KB gzipped).
- **Positive:** Change detection only runs when signals actually change, not on every `setTimeout`, `Promise.resolve`, or `addEventListener`.
- **Positive:** `OnPush` component strategy is effectively the default — components only update when their inputs or template-bound signals change.
- **Negative:** Any code that relies on `NgZone` or `ApplicationRef.tick()` must be refactored. Third-party Angular libraries that assume zone.js may break (none are used in this project).
- **Negative:** `async` pipe in templates still works with zone.js loaded as a peer dependency, but without zone.js, the `async` pipe relies on `ChangeDetectorRef.markForCheck()`. In practice, all async-to-signal conversion is explicit via `.subscribe()`, so this is not an issue.
