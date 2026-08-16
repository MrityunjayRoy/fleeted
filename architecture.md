# Architecture — Luxury Ride Booking Demo

## 1. System overview

```
┌───────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Customer app │   │ Vendor portal│   │  Ops console │   │  Driver app  │
│  (Next.js)    │   │  (Next.js)   │   │  (Next.js)   │   │  (Next.js)   │
└──────┬────────┘   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │  REST + JWT       │  REST + WS       │ REST + WS       │ REST + WS
       └─────────┬─────────┴────────┬─────────┴───────┬─────────┴─────────┘
                 ▼                  ▼                 ▼
        ┌───────────────────────────────────────────────────────┐
        │                  Express API server                   │
        │  Controllers → Services (domain logic) → Repositories  │
        │  Socket.IO gateway (fan-out of domain events)          │
        └───────────────────────────────────────────────────────┘
                 ▼
        ┌─────────────────┐          swap impl →        ┌────────────────┐
        │  SQLite (Drizzle)│  ◀─── repository facade ──▶│ Postgres/Mongo │
        └─────────────────┘   (interfaces, DI-bound)    └────────────────┘
```

Single Express server serves both REST and WebSocket. The Next.js app is a thin client: four dashboards reading the same APIs, subscribing to the same event stream via role-scoped rooms.

## 2. Monorepo layout (pnpm workspaces)

```
fleeted/
├── package.json               # root scripts: dev, build, test, typecheck, lint
├── pnpm-workspace.yaml
├── plan.md
├── architecture.md
├── exec/                      # phase-by-phase execution documents
└── packages/
    ├── shared/                # Zod schemas, DTO types, enums — source of truth
    ├── server/                # Express + TypeScript backend
    └── web/                   # Next.js frontend
```

**`packages/shared`** — everything both sides need, defined once:

- Enums: `Role` (CUSTOMER | VENDOR | OPS | DRIVER), `RideStatus` (PENDING | MATCHING | CONFIRMED | STARTED | COMPLETED | CANCELLED), `OfferStatus` (PENDING | ACCEPTED | REJECTED | RELEASED), `CarCategory`
- Zod request schemas (login, create ride, accept offer, approve offer, start/complete, availability toggle)
- Inferred response DTO types (RideDto, RideOfferDto, CarModelDto, VendorDto, ChauffeurDto, NotificationDto, ...)

Server validates requests with these schemas and maps entities to DTOs; web types its UI state with the inferred types. No type drift between backend and frontend.

## 3. Backend architecture (`packages/server`)

```
src/
├── config/
│   ├── env.ts            # zod-validated environment (PORT, JWT_SECRET, DB path, ...)
│   └── container.ts      # composition root: builds and wires all dependencies
├── db/
│   ├── schema/           # Drizzle table definitions (SQLite)
│   ├── client.ts         # drizzle client factory (file or :memory:)
│   ├── repositories/     # Drizzle*Repository — SQLite implementations
│   ├── interfaces/       # I*Repository — the swappable DB facade
│   └── seed.ts           # demo data (idempotent)
├── domain/
│   ├── entities/         # plain TS domain types
│   ├── enums.ts          # domain enums (re-exported from shared)
│   ├── errors/           # AppError + typed domain errors
│   └── events.ts         # typed EventEmitter + domain event definitions
├── services/
│   ├── auth.service.ts
│   ├── matching.service.ts
│   ├── ride.service.ts
│   ├── offer.service.ts
│   ├── ops.service.ts
│   ├── driver.service.ts
│   └── notification.service.ts
├── dto/                  # entity → response-DTO mappers (toRideDto, ...)
├── controllers/          # thin HTTP handlers (parse → call service → map to DTO)
├── middleware/
│   ├── auth.ts           # JWT verification
│   ├── require-role.ts   # role guard factory
│   ├── validate.ts       # zod schema validation
│   └── error-handler.ts  # global error → JSON response
├── routes/               # router registration
├── ws/
│   └── gateway.ts        # Socket.IO setup, JWT handshake auth, role rooms, event fan-out
├── app.ts                # express app assembly (no listen)
└── server.ts             # entrypoint: build container, start HTTP + WS
```

## 4. Design patterns & rationale

| Pattern                                     | Where                                        | Why                                                                                                                                                                                                                                            |
| ------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repository / DB facade**                  | `db/interfaces/*` + `db/repositories/*`      | All persistence behind interfaces. SQLite via Drizzle today; Postgres = new impl of same interfaces + swap DI binding; Mongo = one adapter per repository. Services never touch SQL.                                                           |
| **Dependency injection (composition root)** | `config/container.ts`                        | Hand-rolled typed factories (no decorators/reflection). Explicit wiring, fully type-safe, trivial to substitute fakes in tests.                                                                                                                |
| **Domain events (port/adapter)**            | `domain/events.ts`                           | Services emit typed events (`RideCreated`, `OfferAccepted`, `RideConfirmed`, `RideCancelled`, `RideStarted`, `RideCompleted`). NotificationService (persistence) and WsGateway (push) subscribe. Keeps Socket.IO and DB out of business logic. |
| **DTO boundary**                            | `dto/`                                       | Entities never leave the server; wire format is explicit, versioned by zod inference, mappable per-route.                                                                                                                                      |
| **Validation at the edge**                  | `middleware/validate.ts`                     | All input validated by shared zod schemas before reaching services.                                                                                                                                                                            |
| **Error model**                             | `domain/errors/`                             | `AppError(statusCode, code, message)` base + typed subclasses (`OfferAlreadyAcceptedError`, `CarNotAvailableError`, ...). Global handler maps to JSON; WS layer maps to `error` events.                                                        |
| **Thin controllers / fat services**         | controllers call one service method, map DTO | Business logic testable without HTTP.                                                                                                                                                                                                          |

## 5. Domain model

```
User (customer)        — id, name, phone, email
Vendor                 — id, name, phone, isCompany (company fleet = vendor)
CarModel               — id, name, category, basePrice, pricePerKm, capacity, description
VendorCar              — id, vendorId, modelId, plateNumber, isAvailable
Chauffeur              — id, vendorId, name, phone, licenseNumber, status (AVAILABLE | ON_RIDE | OFF_DUTY)
Ride                   — id, customerId, modelId, pickup, dropoff, pickupTime, distanceKm,
                          price, status, timings (createdAt/confirmedAt/startedAt/completedAt/cancelledAt)
RideOffer              — id, rideId, vendorId, vendorCarId?, chauffeurId?, status, timestamps
Notification           — id, recipientRole, recipientId?, type, message, payload, read, createdAt
```

### Ride state machine

```
          book (matching)
PENDING ─────────────────────────▶ MATCHING
                                      │  ops approves offer
                                      ▼
                                  CONFIRMED ── driver starts ──▶ STARTED ── driver completes ──▶ COMPLETED
                                      │                            │
                    cancel (any time) └────▶ CANCELLED ◀───────────┘
```

Transitions and guards:

| From              | To        | Trigger                | Guard / side effects                                                                                                                           |
| ----------------- | --------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| —                 | PENDING   | Customer books         | Price computed (base + distance × perKm); stored                                                                                               |
| PENDING           | MATCHING  | Matching runs          | One `RideOffer`(PENDING) per vendor having model + available car + available chauffeur; `ride:new` → vendor rooms                              |
| MATCHING          | CONFIRMED | Ops approves an offer  | Offer → ACCEPTED (ops-approved); car + chauffeur locked (`ON_RIDE`/unavailable); other offers → REJECTED; `ride:confirmed` → driver + customer |
| MATCHING          | CANCELLED | Customer / ops cancels | All offers → RELEASED; car/chauffeur freed; `ride:cancelled` → all parties                                                                     |
| CONFIRMED         | STARTED   | Driver starts          | `ride:started` → ops + customer                                                                                                                |
| STARTED           | COMPLETED | Driver completes       | Car/chauffeur freed; `ride:completed` → ops + customer                                                                                         |
| CONFIRMED/STARTED | CANCELLED | Ops cancels            | Same release semantics as above                                                                                                                |

**Cancel-after-vendor-accept** (explicitly handled): ride in MATCHING with one or more ACCEPTED offers → all offers RELEASED, car/chauffeur statuses restored, vendors + ops + driver notified. No stale locks.

### Matching rule (booking time, single pass)

Vendor qualifies iff:

1. owns a `VendorCar` of the requested `CarModel` with `isAvailable = true`, **and**
2. has at least one `Chauffeur` with `status = AVAILABLE`.

The company fleet (`isCompany = true`) qualifies under the same rules.

## 6. REST API

| Method | Path                                        | Role                   | Purpose                                         |
| ------ | ------------------------------------------- | ---------------------- | ----------------------------------------------- |
| POST   | `/api/auth/login`                           | public                 | Role-switcher login → `{ token, role, userId }` |
| GET    | `/api/car-models`                           | public                 | Model catalog with prices                       |
| POST   | `/api/rides`                                | CUSTOMER               | Book a ride (triggers matching)                 |
| GET    | `/api/rides/mine`                           | CUSTOMER/DRIVER/VENDOR | Rides scoped to the caller                      |
| GET    | `/api/rides/:id`                            | CUSTOMER/OPS           | Ride detail                                     |
| POST   | `/api/rides/:id/cancel`                     | CUSTOMER/OPS           | Cancel ride (release offers)                    |
| GET    | `/api/vendors/:id/offers`                   | VENDOR                 | Pending + history offers                        |
| GET    | `/api/offers/:id`                           | VENDOR/OPS             | Offer detail                                    |
| POST   | `/api/offers/:id/accept`                    | VENDOR                 | Assign vendorCar + chauffeur                    |
| GET    | `/api/vendors/:id/cars`                     | VENDOR                 | Own fleet (car + chauffeur pickers)             |
| POST   | `/api/vendors/:id/cars/:carId/availability` | VENDOR                 | Toggle car availability                         |
| GET    | `/api/ops/rides`                            | OPS                    | All rides (filter by status)                    |
| GET    | `/api/ops/rides/:id`                        | OPS                    | Ride + all offers + vendor/chauffeur/car detail |
| POST   | `/api/ops/offers/:id/approve`               | OPS                    | Approve offer → confirm ride, reject others     |
| POST   | `/api/ops/rides/:id/cancel`                 | OPS                    | Ops-side cancellation                           |
| POST   | `/api/driver/rides/:id/start`               | DRIVER                 | Start ride                                      |
| POST   | `/api/driver/rides/:id/complete`            | DRIVER                 | Complete ride                                   |
| GET    | `/api/notifications`                        | any                    | Unread/read notification history                |

All requests (except login) carry `Authorization: Bearer <jwt>`. Responses are DTO-mapped JSON; errors are `{ error: { code, message } }` with proper HTTP status.

## 7. WebSocket layer (Socket.IO)

- Client connects with JWT in handshake → gateway authenticates, joins rooms:
  - `customer:{userId}`, `driver:{userId}`, `vendor:{vendorId}`, `ops`
- Gateway subscribes to domain events and emits:

| Domain event               | WS event         | Rooms                                          |
| -------------------------- | ---------------- | ---------------------------------------------- |
| RideCreated (with matches) | `ride:new`       | each matching `vendor:{id}`                    |
| OfferAccepted              | `offer:accepted` | `ops`                                          |
| RideConfirmed              | `ride:confirmed` | `driver:{id}`, `customer:{id}`, `ops`          |
| RideCancelled              | `ride:cancelled` | vendor(s), `ops`, driver if assigned, customer |
| RideStarted                | `ride:started`   | `ops`, `customer:{id}`                         |
| RideCompleted              | `ride:completed` | `ops`, `customer:{id}`, vendor                 |

- Every emitted event is also **persisted** as a `Notification` row (NotificationService) so refreshed dashboards show history.
- Acknowledgment events (`offer:accepted`, `ride:started`, ...) are also delivered back to the actor's own room for UI consistency.

## 8. Data access & the DB swap story

- `db/interfaces/` defines: `IUserRepository`, `IVendorRepository`, `ICarModelRepository`, `IVendorCarRepository`, `IChauffeurRepository`, `IRideRepository`, `IRideOfferRepository`, `INotificationRepository`.
- `db/repositories/` implements them with Drizzle (SQLite driver `better-sqlite3`, `:memory:` support for tests).
- Container binds interface → implementation at the composition root.
- **Swap path:** Postgres → new Drizzle dialect + connection string (schema/query changes minimal). Mongo → write `Mongo*Repository` impls against the same interfaces; nothing above the repository layer changes.

## 9. Frontend architecture (`packages/web`)

Next.js App Router, client-heavy dashboards, Tailwind styling.

```
web/src/
├── app/
│   ├── layout.tsx           # global shell, providers
│   ├── login/page.tsx       # role switcher
│   ├── page.tsx             # customer dashboard
│   ├── vendor/page.tsx
│   ├── ops/page.tsx
│   └── driver/page.tsx
├── components/              # shared UI: StatusBadge, RideCard, OfferCard, Toast, ...
├── lib/
│   ├── api.ts               # typed fetch client (base URL, JWT header, error parse)
│   ├── auth.tsx             # auth context/provider (token + role, localStorage)
│   ├── swr-hooks.ts         # typed data hooks per resource
│   └── useSocket.ts         # socket.io-client hook (auto-connect with JWT, event map)
└── types.ts                 # re-exports from packages/shared
```

- **Auth:** login form picks a seeded account + role → JWT stored in localStorage → auth context guards each dashboard.
- **Data:** SWR for REST reads (catalog, my rides, ops list, offers) with optimistic refresh; Socket.IO for live pushes (toast + list refresh).
- **Live-update strategy:** WS event handlers update SWR caches (`mutate`) rather than maintaining separate state — single source of truth, refresh-safe.

## 10. Error handling & observability

- Typed `AppError` hierarchy with stable codes; global middleware returns `{ error: { code, message } }`.
- Validation errors → `400` with per-field details from zod.
- WS: service errors during socket-triggered actions surface as `error` events to the acting room.
- `morgan`-style request logging (dev), structured console errors on event/notification failures.

## 11. Testing strategy

- **Unit (Vitest):** MatchingService (qualification rules), RideService (price, cancellation release logic incl. cancel-after-accept), OfferService (accept guards), OpsService (approve wins race, others rejected), NotificationService persistence.
- **Integration (supertest + in-memory SQLite):** full lifecycle: login → book → vendor accept → ops approve → driver start → complete; plus cancel-after-accept; plus auth/role guards (403s), validation (400s).
- **WS:** minimal socket.io-client integration test asserting `ride:new` and `ride:confirmed` fan-out.
- **Frontend:** out of scope for the demo (manual walkthrough in runbook).

## 12. Demo accounts & seed data (India / INR locale)

- 5 car models (e.g., Mercedes S-Class, Rolls-Royce Ghost, Range Rover Autobiography, Lincoln Town Car, Vintage Rolls-Royce Silver Cloud) across categories (Sedan / SUV / Limousine / Vintage), prices in ₹ (base fare + per-km)
- 3 external vendors + the company fleet vendor, each owning 2–4 cars and 2–4 chauffeurs with realistic Indian names
- Demo rides reference Indian routes (e.g., Bandra → Juhu, Connaught Place → Aerocity, Whitefield → KR Puram)
- Demo users: 2 customers, 1 ops manager, 1 chauffeur per vendor, 1 vendor account per vendor
- Seeded flags are tuned so every model has ≥1 available vendor + chauffeur → every booking matches immediately

## 13. Scripts (root package.json)

| Script           | Action                                                   |
| ---------------- | -------------------------------------------------------- |
| `pnpm dev`       | concurrently run server (`tsx watch`) + web (`next dev`) |
| `pnpm build`     | typecheck + build all packages                           |
| `pnpm typecheck` | strict `tsc --noEmit` across packages                    |
| `pnpm test`      | vitest run in server package                             |
| `pnpm seed`      | run seed script against dev SQLite                       |
| `pnpm lint`      | eslint + prettier check                                  |

## 14. Explicitly deferred (documented in exec phase notes)

- Multi-round matching, vendor-to-vendor fallback, pricing rules engine, payments, maps, real auth, admin CRUD — noted as future work per phase, not implemented in the demo.
