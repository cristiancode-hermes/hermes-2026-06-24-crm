# Learnings

This document captures the technical lessons and hard-won insights from building the Multi-Tenant CRM. Written for future engineers (and our future selves) who encounter similar problems.

---

## 1. TypeScript 5.9 Decorator Compatibility (TS1240 / TS1241)

**The problem:** TypeScript 5.9 changed how decorators interact with experimental decorator metadata. When building the NestJS API (which uses class-based decorators extensively — `@Controller`, `@Get`, `@Entity`, `@Column`, etc.), the TypeScript compiler initially emitted errors like:

```
TS1240: Decorators are not valid here. Use 'experimentalDecorators'?
TS1241: Unable to resolve signature of property decorator when called as an expression.
```

**Root cause:** TypeScript 5.9 ships with Stage 3 decorators enabled by default. NestJS and TypeORM use the older **experimental decorators** (`experimentalDecorators: true`, `emitDecoratorMetadata: true`). The two decorator systems conflict when both are active.

**Fix:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true
  }
}
```

Additionally, must set `target` to at least `ES2022` (NestJS 11 requires it) and ensure `lib` includes `ES2022`.

**Key insight:** NestJS 11 with `@nestjs/cli` 11.x uses `nest build` which delegates to the TypeScript compiler under the hood. The `tsconfig.build.json` must inherit the correct decorator settings from the base `tsconfig.json`. The `nest build` command also applies its own decorator transform — if you see decorator errors, check that `tsconfig.json` has both `experimentalDecorators: true` and `emitDecoratorMetadata: true`.

**Why `nest build --tsc` was used instead of `nest build` (default swc):** NestJS 11's default builder uses `swc` (Speedy Web Compiler) which is significantly faster but has limited decorator support. With `@nestjs/cli` 11.x, the default builder skips TypeScript's decorator metadata emit. Setting `"builder": "tsc"` in `nest-cli.json` (or running `nest build --tsc`) forces the TypeScript compiler path, which correctly handles `emitDecoratorMetadata`.

---

## 2. Multi-Tenant Query Scoping

**The problem:** Every database query must be scoped to the current organization. Forgetting an `organizationId` filter leaks data across tenants.

**What we learned:** The cleanest enforcement mechanism is **parameterized service methods**. In NestJS, every `ContactsService`, `DealsService`, and `ActivitiesService` method takes `organizationId: number` as its first or second parameter. Controllers extract `req.user.organizationId` from the JWT payload and pass it down.

```typescript
// Pattern:
async findAll(organizationId: number, query: PaginationQueryDto): Promise<...> {
  const where: FindOptionsWhere<Contact> = { organizationId };
  // ...
}

// Controller:
const user = req.user as { organizationId: number };
return this.contactsService.findAll(user.organizationId, query);
```

**The gotcha:** The JWT payload carries `organizationId` but TypeScript's `req.user` type is `any` by default. You must cast it, or better, augment the Express `Request` type. In this project, we cast:

```typescript
const user = req.user as { organizationId: number };
```

**Extending for production:** For a production system, consider:

- A NestJS **interceptor** that automatically injects `organizationId` into every service call (reduces boilerplate).
- A **custom decorator** like `@OrgId()` that reads from `req.user`.
- **TypeORM global filters** (the `@Where` decorator or custom repository base classes) that automatically append `organizationId` to every query.

For this project's scope, the explicit parameter pattern was chosen for clarity.

---

## 3. `nest build --tsc` for Decorator Compatibility

**The problem:** `nest build` (NestJS 11) uses `swc` by default. SWC handles `experimentalDecorators` but does **not** support `emitDecoratorMetadata` — which NestJS's `ValidationPipe`, `@InjectRepository`, and Swagger `@ApiTags` depend on at runtime.

**Symptoms:**
- `@InjectRepository(Contact)` fails at runtime with `Nest can't resolve dependencies of ContactsService. Please make sure that Contact entity is available in the module context`.
- Swagger decorators (`@ApiProperty`, `@ApiTags`) don't render correctly.
- `class-validator` / `class-transformer` metadata is missing.

**Fix:** Use `nest build --tsc` to force the TypeScript compiler, or set in `nest-cli.json`:

```json
{
  "compilerOptions": {
    "builder": "tsc"
  }
}
```

**What this costs:** TypeScript compilation is slower than SWC (~2-5x depending on project size). For development, `nest start --watch` can still use SWC if you don't need metadata reflection during watch mode. For production builds, always use `--tsc`.

**NestJS 11 nuance:** The `@nestjs/cli` v11 changed the default builder from `tsc` to `swc`. This is a breaking change from NestJS 10 documentation. Always verify with `nest info` or check `nest-cli.json`.

---

## 4. HTML5 Drag-and-Drop for Kanban

**The problem:** Implement drag-and-drop reordering of deals between Kanban columns without any external library.

**What we learned:**

**The `dataTransfer` pattern:**
```typescript
// Source (DealCardComponent)
onDragStart(event: DragEvent): void {
  event.dataTransfer?.setData('text/plain', String(this.deal().id));
  event.dataTransfer!.effectAllowed = 'move';
}

// Target (KanbanColumnComponent)
onDragOver(event: DragEvent): void {
  event.preventDefault(); // REQUIRED — without this, drop is denied
}

onDrop(event: DragEvent): void {
  event.preventDefault();
  const dealId = event.dataTransfer?.getData('text/plain');
  // ... handle drop
}
```

**The custom event bus pattern:**
The drop handler in `KanbanColumnComponent` fires a `CustomEvent` on `window`. The parent `KanbanBoardComponent` listens for this event and emits via `@Output()`:

```typescript
// In KanbanColumnComponent.onDrop():
window.dispatchEvent(new CustomEvent('deal-dropped', {
  detail: { dealId: Number(dealId), stage: this.stage() },
}));

// In KanbanBoardComponent constructor:
window.addEventListener('deal-dropped', this.handleDrop.bind(this) as EventListener);
```

**Why not use Angular `@Output()` directly?** The `KanbanColumnComponent` is 2 levels deep from `PipelinePageComponent` (PipelinePage → KanbanBoard → KanbanColumn → DealCard). Passing events through 4 levels of `@Output()` is verbose. The custom event bypasses intermediate levels. The trade-off is implicit coupling.

**Optimistic updates:**
The `PipelinePageComponent.onStageChange()` immediately updates the local `deals` signal before the API responds:

```typescript
const oldStage = deal.stage;
this.deals.update((deals) =>
  deals.map((d) => (d.id === event.dealId ? { ...d, stage: event.stage } : d))
);

this.dealsService.updateStatus(event.dealId, { stage: event.stage, position: 0 }).subscribe({
  error: () => {
    // Rollback on failure
    this.deals.update((deals) =>
      deals.map((d) => (d.id === event.dealId ? { ...d, stage: oldStage } : d))
    );
    this.toastService.error('Error updating deal stage');
  },
});
```

This makes drag-and-drop feel instant even if the network is slow.

**Limitations discovered:**
- No touch support. The HTML5 DnD API does not fire `dragstart` on touch devices without a polyfill.
- Drag ghost image is browser-dependent. Chrome renders a semi-transparent clone; Firefox renders a generic icon.
- No `dragEnd` cleanup — if the user drops outside a column, the deal stays in its original position (which is correct behavior here).

---

## 5. SVG Bar Charts Without Libraries

**The problem:** The dashboard needs a bar chart showing pipeline value by stage. Adding Chart.js or D3 would increase the bundle by 40-60KB for a single simple chart.

**Solution:** Inline SVG with Angular templates and `computed()` signals.

**Key insight:** An SVG bar chart is just `<rect>` elements inside an `<svg>` with some math:

```typescript
// PipelineChartComponent
readonly maxValue = computed(() => {
  const values = this.data().map((d) => d.value);
  return values.length ? Math.max(...values) : 1;
});
readonly barHeight = 200;
readonly svgWidth = computed(() => Math.max(600, this.data().length * 90));

getBarHeight(value: number): number {
  return (value / this.maxValue()) * this.barHeight;
}
```

```html
<svg [attr.width]="svgWidth()" [attr.height]="barHeight + 40">
  @for (item of data(); track item.stage; let i = $index) {
    <g [attr.transform]="'translate(' + (i * 90 + 20) + ', 0)'">
      <rect
        [attr.y]="barHeight - getBarHeight(item.value)"
        [attr.height]="getBarHeight(item.value)"
        width="60"
        class="fill-primary-500"
      />
      <text [attr.y]="barHeight + 20" class="text-xs" text-anchor="middle">
        {{ getLabel(item.stage) }}
      </text>
    </g>
  }
</svg>
```

**Lessons:**
- SVG with `computed()` signals is reactive — when `data` input changes, the chart re-renders automatically.
- No canvas rendering, no library overhead. The chart weighs ~1KB of TypeScript.
- For accessibility, add `role="img"` and `aria-label` attributes. This was not done here but should be in a production version.
- For responsive sizing, use `viewBox` instead of fixed `width`/`height`. The current implementation uses fixed pixel dimensions.

---

## 6. Angular 22 with Tailwind CSS v4 PostCSS Setup

**The problem:** Tailwind CSS v4 uses a new PostCSS plugin (`@tailwindcss/postcss`) instead of the v3 `tailwindcss` package. Angular 22's build system (`@angular/build`) needs explicit PostCSS configuration.

**Setup:**

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

And in `styles.css`, the v4 import syntax:

```css
@import "tailwindcss";

@theme {
  /* custom tokens */
}
```

**Key difference from v3:** No `tailwind.config.js`. All configuration goes into the `@theme` block in CSS. This is a paradigm shift — Tailwind v4 is CSS-first, config-file-second.

**Gotcha:** Angular's `@angular/build` v22.0.3 automatically processes PostCSS when it detects `postcss.config.js` in the project root. No changes to `angular.json` build options are needed. If Tailwind classes don't appear in the built output, verify that `postcss.config.js` is in the `apps/web/` directory (not the monorepo root) and that `@tailwindcss/postcss` is in `devDependencies`, not `dependencies`.

---

## 7. Seeding with OnModuleInit and Transaction Hazard

**The problem:** The `SeedService` implements `OnModuleInit` and runs on application startup. If it fails mid-seed (e.g., after creating org but before creating users), the database is left in an inconsistent state.

**Current behavior:** `AuthService.register()` handles this by catching errors and deleting the org:

```typescript
try {
  const user = await this.usersService.createUser({ ... });
  // ... sign JWT
} catch (err) {
  await this.orgRepository.delete(savedOrg.id); // rollback
  throw err;
}
```

But `SeedService.seed()` has no such rollback logic. If the seed fails after creating the organization but before creating contacts/deals/activities, the database is partially seeded (the `orgCount > 0` check means it won't re-run).

**Recommendation:** For a production seed, wrap the entire seed in a TypeORM transaction using `QueryRunner`:

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();
try {
  // ... all seed operations using queryRunner.manager
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release();
}
```

For this project's scope, the seed runs once locally and the risk is acceptable.

---

## 8. Config Module: `DATABASE_PATH` vs `DATABASE_URL`

**The problem:** The `.env.example` uses `DATABASE_URL=sqlite:///data/crm.db`, but the `configuration.ts` module reads `DATABASE_PATH`:

```typescript
// configuration.ts
database: process.env.DATABASE_PATH ?? './data/crm.sqlite',
```

This mismatch means setting `DATABASE_URL` in the env file has **no effect**. The actual environment variable used is `DATABASE_PATH`. For a PostgreSQL migration, this would need to be harmonized.

**Fix:** Either rename the env example to use `DATABASE_PATH`, or change the configuration to parse both `DATABASE_URL` and `DATABASE_PATH` with a priority order:

```typescript
database: process.env.DATABASE_PATH ?? new URL(process.env.DATABASE_URL ?? 'sqlite:///data/crm.db').pathname,
```

This is a known tech debt item. For the current SQLite-only setup, the default path works fine.
