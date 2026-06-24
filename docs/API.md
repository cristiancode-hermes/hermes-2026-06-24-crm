# API Reference

Base URL: `http://localhost:3000`

All authenticated endpoints require the header `Authorization: Bearer <token>`.

## Authentication

### POST /api/auth/register

Register a new organization and create the admin user in one request.

**Request body:**
```json
{
  "orgName": "Acme Corporation",
  "userName": "John",
  "email": "john@acme.com",
  "password": "secret123"
}
```

**Response (201 Created):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John",
    "email": "john@acme.com",
    "organizationId": 1
  }
}
```

**Validation rules:**
- `orgName` → string, min 2 characters
- `userName` → string, min 2 characters
- `email` → valid email format
- `password` → string, min 6 characters

**Errors:**
- `409 Conflict` — Organization slug already exists (org name slugified)
- `409 Conflict` — Email already registered

---

### POST /api/auth/login

Authenticate with email and password.

**Request body:**
```json
{
  "email": "admin@acme.com",
  "password": "dev-secret"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@acme.com",
    "organizationId": 1
  }
}
```

The JWT payload contains `{ sub, email, organizationId }` and expires based on `JWT_EXPIRES_IN` (default 7 days).

**Errors:**
- `401 Unauthorized` — Invalid email or password

---

### GET /api/auth/profile

Get the current authenticated user's profile. Requires Bearer token.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Admin",
  "email": "admin@acme.com",
  "role": "admin",
  "organizationName": "Acme Corporation",
  "organizationId": 1
}
```

---

## Contacts

All contact endpoints require JWT auth. All results are scoped to the user's organization.

### GET /api/contacts

List contacts with pagination, search, and sorting.

**Query parameters:**

| Parameter   | Type    | Default | Description                    |
| ----------- | ------- | ------- | ------------------------------ |
| `page`      | integer | 1       | Page number (min 1)            |
| `limit`     | integer | 10      | Items per page (max 100)       |
| `q`         | string  | —       | Search query (matches name)    |
| `sortBy`    | string  | —       | Field to sort by               |
| `sortOrder` | enum    | `DESC`  | `ASC` or `DESC`                |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "+52 555-1001",
      "company": "TechCorp",
      "role": "CEO",
      "notes": "Contact from TechCorp",
      "organizationId": 1,
      "createdAt": "2026-06-24T00:00:00.000Z",
      "updatedAt": "2026-06-24T00:00:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "totalPages": 1
}
```

---

### GET /api/contacts/:id

Get a single contact by ID. Includes related deals and activities.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+52 555-1001",
  "company": "TechCorp",
  "role": "CEO",
  "notes": "Contact from TechCorp",
  "organizationId": 1,
  "createdAt": "2026-06-24T00:00:00.000Z",
  "updatedAt": "2026-06-24T00:00:00.000Z",
  "deals": [
    {
      "id": 1,
      "name": "Cloud Migration",
      "value": 45000,
      "stage": "Nuevo",
      "position": 0,
      "expectedCloseDate": "2026-07-24",
      "notes": "Deal: Cloud Migration",
      "contactId": 1,
      "organizationId": 1,
      "createdAt": "2026-06-24T00:00:00.000Z",
      "updatedAt": "2026-06-24T00:00:00.000Z"
    }
  ],
  "activities": [
    {
      "id": 1,
      "type": "call",
      "description": "Initial discovery call with client",
      "date": "2026-06-23",
      "contactId": 1,
      "dealId": 1,
      "organizationId": 1,
      "createdAt": "2026-06-24T00:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `404 Not Found` — Contact not found or not in this organization

---

### POST /api/contacts

Create a new contact.

**Request body:**
```json
{
  "name": "New Contact",
  "email": "new@example.com",
  "phone": "+52 555-2000",
  "company": "NewCo",
  "role": "Manager",
  "notes": "Optional notes"
}
```

All fields are required except `phone`, `company`, `role`, and `notes` (all optional).

**Response (201 Created):**
```json
{
  "id": 11,
  "name": "New Contact",
  "email": "new@example.com",
  "phone": "+52 555-2000",
  "company": "NewCo",
  "role": "Manager",
  "notes": "Optional notes",
  "organizationId": 1,
  "createdAt": "2026-06-24T01:00:00.000Z",
  "updatedAt": "2026-06-24T01:00:00.000Z"
}
```

---

### PUT /api/contacts/:id

Update an existing contact. All fields are optional — only provided fields are updated.

**Request body:**
```json
{
  "name": "Updated Name",
  "phone": "+52 555-3000"
}
```

**Response (200 OK):** Returns the updated contact entity.

**Errors:**
- `404 Not Found` — Contact not found

---

### DELETE /api/contacts/:id

Delete a contact.

**Response (200 OK):**
```json
{
  "message": "Contact deleted successfully"
}
```

**Errors:**
- `404 Not Found` — Contact not found

---

## Deals

All deal endpoints require JWT auth. Results are scoped to the user's organization.

### GET /api/deals

List deals. Optionally filter by stage or contact.

**Query parameters:**

| Parameter   | Type    | Description                    |
| ----------- | ------- | ------------------------------ |
| `stage`     | string  | Filter by pipeline stage       |
| `contactId` | integer | Filter by associated contact   |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Cloud Migration",
    "value": 45000,
    "stage": "Nuevo",
    "position": 0,
    "expectedCloseDate": "2026-07-24",
    "notes": "Deal: Cloud Migration",
    "contactId": 1,
    "contact": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com"
    },
    "organizationId": 1,
    "createdAt": "2026-06-24T00:00:00.000Z",
    "updatedAt": "2026-06-24T00:00:00.000Z"
  }
]
```

Results are ordered by `position ASC, createdAt DESC`.

---

### GET /api/deals/kpi

Get pipeline KPI data for the organization.

**Response (200 OK):**
```json
{
  "totalDeals": 18,
  "pipelineValue": 270000,
  "wonValue": 50000,
  "conversionRate": 50,
  "stageValues": [
    { "stage": "Nuevo", "value": 105000, "count": 3 },
    { "stage": "Calificado", "value": 87000, "count": 3 },
    { "stage": "Propuesta", "value": 89000, "count": 3 },
    { "stage": "Negociación", "value": 104000, "count": 3 },
    { "stage": "Cerrado Ganado", "value": 50000, "count": 3 },
    { "stage": "Cerrado Perdido", "value": 125000, "count": 3 }
  ]
}
```

KPI calculation:
- `pipelineValue` — sum of values for active stages (Nuevo → Negociación)
- `wonValue` — sum of values for won deals
- `conversionRate` — won / (won + lost) × 100

---

### GET /api/deals/upcoming

Get deals where `expectedCloseDate` falls within the next 7 days.

**Response (200 OK):**
```json
[
  {
    "id": 10,
    "name": "DevOps Consulting",
    "value": 18000,
    "stage": "Negociación",
    "expectedCloseDate": "2026-07-01",
    "contact": {
      "id": 2,
      "name": "María García"
    },
    "organizationId": 1
  }
]
```

Deals without an `expectedCloseDate` are excluded.

---

### GET /api/deals/:id

Get a single deal by ID. Includes related contact and activities.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Cloud Migration",
  "value": 45000,
  "stage": "Nuevo",
  "position": 0,
  "expectedCloseDate": "2026-07-24",
  "notes": "Deal: Cloud Migration",
  "contactId": 1,
  "contact": { "id": 1, "name": "Juan Pérez", "email": "juan@example.com" },
  "organizationId": 1,
  "createdAt": "2026-06-24T00:00:00.000Z",
  "updatedAt": "2026-06-24T00:00:00.000Z",
  "activities": []
}
```

**Errors:**
- `404 Not Found` — Deal not found

---

### POST /api/deals

Create a new deal.

**Request body:**
```json
{
  "name": "New Deal",
  "value": 25000,
  "stage": "Calificado",
  "contactId": 1,
  "expectedCloseDate": "2026-08-01",
  "notes": "Optional notes"
}
```

`stage` defaults to `"Nuevo"` if not provided. `contactId` is required.

**Valid stages:** `Nuevo`, `Calificado`, `Propuesta`, `Negociación`, `Cerrado Ganado`, `Cerrado Perdido`

**Response (201 Created):** Returns the created deal entity.

---

### PUT /api/deals/:id

Update a deal. All fields optional.

**Request body:**
```json
{
  "value": 35000,
  "stage": "Negociación"
}
```

**Response (200 OK):** Returns the updated deal entity.

---

### DELETE /api/deals/:id

Delete a deal.

**Response (200 OK):**
```json
{
  "message": "Deal deleted successfully"
}
```

---

### PATCH /api/deals/:id/status

Update just the stage and position of a deal. Used by the Kanban board drag-and-drop.

**Request body:**
```json
{
  "stage": "Negociación",
  "position": 0
}
```

**Response (200 OK):** Returns the updated deal entity.

**Valid stages:** `Nuevo`, `Calificado`, `Propuesta`, `Negociación`, `Cerrado Ganado`, `Cerrado Perdido`

---

## Activities

### GET /api/activities

List activities with optional filters.

**Query parameters:**

| Parameter   | Type    | Default | Description              |
| ----------- | ------- | ------- | ------------------------ |
| `page`      | integer | 1       | Page number              |
| `limit`     | integer | 10      | Items per page (max 100) |
| `contactId` | integer | —       | Filter by contact        |
| `dealId`    | integer | —       | Filter by deal           |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "type": "call",
      "description": "Initial discovery call with client",
      "date": "2026-06-23",
      "contactId": 1,
      "dealId": 1,
      "organizationId": 1,
      "contact": { "id": 1, "name": "Juan Pérez" },
      "deal": { "id": 1, "name": "Cloud Migration" },
      "createdAt": "2026-06-24T00:00:00.000Z"
    }
  ],
  "total": 12,
  "page": 1,
  "totalPages": 2
}
```

---

### GET /api/activities/:id

Get a single activity.

**Response (200 OK):** Returns the activity entity with contact and deal relations.

**Errors:**
- `404 Not Found` — Activity not found

---

### POST /api/activities

Create a new activity.

**Request body:**
```json
{
  "type": "call",
  "description": "Follow-up call",
  "date": "2026-06-25",
  "contactId": 1,
  "dealId": 1
}
```

**Valid types:** `note`, `call`, `email`, `meeting`
`contactId` and `dealId` are optional.

**Response (201 Created):** Returns the created activity entity.

---

### DELETE /api/activities/:id

Delete an activity.

**Response (200 OK):**
```json
{
  "message": "Activity deleted successfully"
}
```

---

## Dashboard

### GET /api/dashboard

Get a complete dashboard data aggregate for the organization. Combines KPI data, chart data, upcoming deals, and recent activities in a single response.

**Response (200 OK):**
```json
{
  "kpis": {
    "totalDeals": 18,
    "pipelineValue": 270000,
    "wonValue": 50000,
    "conversionRate": 50
  },
  "chartData": [
    { "stage": "Nuevo", "value": 105000, "count": 3 },
    { "stage": "Calificado", "value": 87000, "count": 3 },
    { "stage": "Propuesta", "value": 89000, "count": 3 },
    { "stage": "Negociación", "value": 104000, "count": 3 },
    { "stage": "Cerrado Ganado", "value": 50000, "count": 3 },
    { "stage": "Cerrado Perdido", "value": 125000, "count": 3 }
  ],
  "upcomingDeals": [
    {
      "id": 10,
      "name": "DevOps Consulting",
      "value": 18000,
      "stage": "Negociación",
      "expectedCloseDate": "2026-07-01",
      "contact": { "id": 2, "name": "María García" },
      "organizationId": 1
    }
  ],
  "recentActivities": [
    {
      "id": 10,
      "type": "email",
      "description": "Sent revised proposal",
      "date": "2026-06-24",
      "contactId": 8,
      "dealId": 10,
      "organizationId": 1,
      "createdAt": "2026-06-24T00:00:00.000Z"
    }
  ]
}
```

## Error Response Format

All API errors follow this shape:

```json
{
  "statusCode": 404,
  "message": "Contact not found",
  "error": "Bad Request"
}
```

Validation errors (400) wrap the message as an array of constraint violations:

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "name must be a string"
  ],
  "error": "Bad Request"
}
```

## Endpoint Summary

| #  | Method | Path                      | Auth Required | Description                           |
|----|--------|---------------------------|:---:|---------------------------------------|
| 1  | POST   | `/api/auth/register`      |  ❌  | Register org + admin user              |
| 2  | POST   | `/api/auth/login`         |  ❌  | Login with email/password              |
| 3  | GET    | `/api/auth/profile`       |  ✅  | Get current user profile               |
| 4  | GET    | `/api/contacts`           |  ✅  | List contacts (paginated)              |
| 5  | GET    | `/api/contacts/:id`       |  ✅  | Get contact with deals & activities    |
| 6  | POST   | `/api/contacts`           |  ✅  | Create contact                         |
| 7  | PUT    | `/api/contacts/:id`       |  ✅  | Update contact                         |
| 8  | DELETE | `/api/contacts/:id`       |  ✅  | Delete contact                         |
| 9  | GET    | `/api/deals`              |  ✅  | List deals (filterable)                |
| 10 | GET    | `/api/deals/kpi`          |  ✅  | Pipeline KPIs                          |
| 11 | GET    | `/api/deals/upcoming`     |  ✅  | Deals closing in 7 days                |
| 12 | GET    | `/api/deals/:id`          |  ✅  | Get deal with contact & activities     |
| 13 | POST   | `/api/deals`              |  ✅  | Create deal                            |
| 14 | PUT    | `/api/deals/:id`          |  ✅  | Update deal                            |
| 15 | DELETE | `/api/deals/:id`          |  ✅  | Delete deal                            |
| 16 | PATCH  | `/api/deals/:id/status`   |  ✅  | Update deal stage (drag-and-drop)      |
| 17 | GET    | `/api/activities`         |  ✅  | List activities (filterable)           |
| 18 | GET    | `/api/activities/:id`     |  ✅  | Get single activity                    |
| 19 | POST   | `/api/activities`         |  ✅  | Create activity                        |
| 20 | DELETE | `/api/activities/:id`     |  ✅  | Delete activity                        |
| 21 | GET    | `/api/dashboard`          |  ✅  | Dashboard aggregate data               |
