# Frontend Architecture

## Overview

The frontend is an Angular 22 application using **signals** for state management, **zoneless change detection**, and **Tailwind CSS v4** for styling. It has 6 pages, ~37 components, and a small set of shared services, models, and utilities.

Folder structure:

```
src/app/
├── app.ts                         # Root component
├── app.html                       # Root template (header + router-outlet)
├── app.config.ts                  # App bootstrap config
├── app.routes.ts                  # Route definitions
├── app.css                        # Global styles (delegates to styles.css)
├── pages/                         # Lazy-loaded page components
│   ├── login/
│   ├── dashboard/
│   ├── contacts/
│   ├── contact-detail/
│   ├── pipeline/
│   ├── deal-detail/
│   └── not-found/
└── shared/                        # Shared code
    ├── components/                # Reusable UI components
    ├── guards/                    # Route guard (authGuard)
    ├── interceptors/              # HTTP interceptor (authInterceptor)
    ├── models/                    # TypeScript interfaces
    └── services/                  # HTTP service wrappers
```

## Signal Architecture

### Principles

1. **Component-local signals for page state.** Each page component declares `signal()` instances for its mutable state (data, loading, error, UI flags). No centralized store.

2. **Service-level signals only for cross-cutting state.** Two services expose signals:
   - `AuthService.currentUser` — a `signal<User | null>` consumed by `HeaderComponent` and the auth guard.
   - `ToastService.toasts` — a `signal<Toast[]>` consumed by `ToastComponent`.

3. **HTTP data flows through services → subscriptions → signal .set().**
   Services return `Observable`. Components subscribe and call `.set()` on signals. No `async` pipe, no RxJS state in services.

4. **`computed()` signals for derived values.**
   `PipelineChartComponent` uses `computed()` for `maxValue` and `svgWidth`. `PipelineValueBarComponent` uses `computed()` for `totalValue` and `wonValue`.

### State Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                        Component                          │
│                                                           │
│  const data = signal<T | null>(null);     ← mutable state  │
│  const loading = signal(true);                            │
│                                                           │
│  constructor() {                                          │
│    this.loadData();                                       │
│  }                                                        │
│                                                           │
│  loadData(): void {                                       │
│    this.loading.set(true);                                │
│    this.service.getData().subscribe({                     │
│      next: (result) => {                                  │
│        this.data.set(result);         ← signal update     │
│        this.loading.set(false);                           │
│      },                                                   │
│    });                                                    │
│  }                                                        │
│                                                           │
│  Template reads signals:                                  │
│  @if (loading()) { ... }                                  │
│  @for (item of data(); track item.id) { ... }             │
└──────────────────────────────────────────────────────────┘
```

### Signal Usage by Component

| Component                      | Signals                                                                 |
| ------------------------------ | ----------------------------------------------------------------------- |
| `LoginPageComponent`           | `isLoginMode`, `loading`, `error`                                       |
| `DashboardPageComponent`       | `data` (DashboardData), `loading`, `error`                              |
| `ContactsPageComponent`        | `contacts`, `loading`, `error`, `page`, `totalPages`, `total`, `searchQuery`, `formLoading`, `showForm`, `editingContact`, `showDeleteConfirm`, `deletingContact` |
| `ContactDetailPageComponent`   | `contact`, `deals`, `activities`, `loading`, `error`, `formLoading`, `showEditForm`, `showActivityForm` |
| `PipelinePageComponent`        | `deals`, `stageValues`, `loading`, `error`, `formLoading`, `showForm`, `editingDeal`, `contactIdFromRoute` |
| `DealDetailPageComponent`      | `deal`, `activities`, `loading`, `error`, `formLoading`, `stageChanging`, `showEditForm`, `showActivityForm` |

### Computed Signal Examples

**PipelineChartComponent** (SVG bar chart):
```typescript
readonly maxValue = computed(() => {
  const values = this.data().map((d) => d.value);
  return values.length ? Math.max(...values) : 1;
});
readonly svgWidth = computed(() => Math.max(600, this.data().length * 90));
```

**PipelineValueBarComponent** (horizontal bar):
```typescript
readonly totalValue = computed(() => {
  return this.stageValues().reduce((sum, sv) => sum + sv.value, 0);
});
```

## Component Tree

```
App
├── HeaderComponent                         [shared]
│   ├── RouterLink (Dashboard)
│   ├── RouterLink (Contacts)
│   ├── RouterLink (Pipeline)
│   └── AuthService.currentUser (signal)
├── RouterOutlet                            [Angular Router]
│   ├── LoginPageComponent                  [lazy]
│   ├── DashboardPageComponent              [lazy]
│   │   ├── KpiCardComponent × 4
│   │   ├── PipelineChartComponent          [SVG bar chart]
│   │   ├── UpcomingDealsComponent
│   │   └── RecentActivityComponent
│   ├── ContactsPageComponent               [lazy]
│   │   ├── ContactSearchComponent
│   │   ├── ContactTableComponent
│   │   ├── ContactFormModalComponent
│   │   ├── PaginationComponent
│   │   ├── ConfirmModalComponent           [shared]
│   │   └── SkeletonLoaderComponent         [shared]
│   ├── ContactDetailPageComponent          [lazy]
│   │   ├── ContactInfoComponent
│   │   ├── DealsListComponent
│   │   ├── ActivityTimelineComponent
│   │   ├── ActivityFormModalComponent
│   │   ├── ContactFormModalComponent
│   │   └── SkeletonLoaderComponent         [shared]
│   ├── PipelinePageComponent               [lazy]
│   │   ├── PipelineControlsComponent
│   │   ├── KanbanBoardComponent
│   │   │   ├── KanbanColumnComponent × 6
│   │   │   │   └── DealCardComponent × N
│   │   ├── PipelineValueBarComponent
│   │   ├── DealFormModalComponent
│   │   └── SkeletonLoaderComponent         [shared]
│   ├── DealDetailPageComponent             [lazy]
│   │   ├── DealInfoComponent
│   │   ├── DealStageSelectorComponent
│   │   ├── ActivityTimelineComponent
│   │   ├── ActivityFormModalComponent
│   │   ├── DealFormModalComponent
│   │   └── SkeletonLoaderComponent         [shared]
│   └── NotFoundPageComponent
└── ToastComponent                          [shared]
```

Total: **1 root + 7 page + 19 page-specific + 7 shared = ~34 components** (plus 3 page-shell components = ~37).

## Services

| Service               | Role                                     | State exposed |
| --------------------- | ---------------------------------------- | ------------- |
| `AuthService`         | Login, register, profile, token mgmt     | `currentUser` signal |
| `ContactsService`     | Contact CRUD + list with pagination      | None (returns Observable) |
| `DealsService`        | Deal CRUD + status + KPI + upcoming      | None |
| `ActivitiesService`   | Activity CRUD + list with filters        | None |
| `DashboardService`    | Fetch dashboard aggregate data           | None |
| `ToastService`        | Toast notification queue                 | `toasts` signal |

All services are `providedIn: 'root'` singletons. HTTP services use `inject(HttpClient)` and hardcode the API base URL (`http://localhost:3000/api/...`).

## Guards and Interceptors

### `authGuard` (route guard)

A functional `CanActivateFn` that checks `AuthService.isAuthenticated()` (presence of `auth_token` in `localStorage`). Redirects to `/login` if not authenticated.

```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated()) return true;
  return router.parseUrl('/login');
};
```

Applied to all routes except `/login` and `/**` (404).

### `authInterceptor` (HTTP interceptor)

A functional `HttpInterceptorFn` that:
1. Reads the JWT token from `localStorage` via `AuthService.getToken()`.
2. Attaches it as `Authorization: Bearer *** if present.
3. On 401 responses, calls `AuthService.logout()` (which clears token and navigates to `/login`).

## Zoneless Change Detection

The app uses `provideZonelessChangeDetection()` in `app.config.ts`. Key implications:

- **No `zone.js` dependency.** Change detection is triggered only by signal writes, input binding changes, and explicit `ChangeDetectorRef.markForCheck()` calls.
- **`async` pipe still works** — Angular's `AsyncPipe` internally calls `markForCheck()` when the observable emits. However, the project doesn't use `async` pipe; all async-to-signal conversion is manual.
- **`NgZone` is unavailable.** Don't inject it. Use signals for all reactive state.
- **Performance benefit.** Fewer change detection cycles — only the components whose signals actually update re-render.
- **Edge case:** `@angular/forms` (ReactiveFormsModule) updates the form model synchronously, and Angular's form directives use `markForChange()` internally, so form bindings work correctly without zone.js.

## Styling Architecture

- **Tailwind CSS v4** with `@import "tailwindcss"` in `styles.css`.
- Custom `@theme` block defines the full palette (primary blue, secondary purple, accent yellow, success green, warning red, neutral grays), font families (Inter + JetBrains Mono), shadows, and border radii.
- Dark mode via `.dark` variant: `@custom-variant dark (&:where(.dark, .dark *))`.
- Custom animations: `@keyframes fade-in`, `slide-up`, `skeleton-pulse`.
- Skeleton loading state is a shared component (`SkeletonLoaderComponent`) that renders placeholder elements with `.animate-skeleton`.
- PostCSS config (`postcss.config.js`) enables Tailwind processing during the Angular build.

## Drag-and-Drop Implementation

The Kanban board uses the **native HTML5 Drag and Drop API**:

| Component              | Role                          | Events used                        |
| ---------------------- | ----------------------------- | ---------------------------------- |
| `DealCardComponent`    | Drag source                   | `dragstart` — sets `dataTransfer` with deal ID |
| `KanbanColumnComponent`| Drop target                   | `dragover` (preventDefault), `dragleave`, `drop` — reads deal ID, dispatches `CustomEvent` |
| `KanbanBoardComponent` | Event coordinator             | Listens for `deal-dropped` custom event, emits `stageChanged` output |

Data flow: `DealCard` → `dragstart` → `KanbanColumn` (drop) → `window.dispatchEvent(CustomEvent)` → `KanbanBoard` (listener) → `stageChanged.emit()` → `PipelinePageComponent.onStageChange()` → `DealsService.updateStatus()` → API.

Optimistic updates: `PipelinePageComponent` immediately updates the deal's stage in the local `deals` signal before the API responds. If the API call fails, it rolls back to the previous stage.
