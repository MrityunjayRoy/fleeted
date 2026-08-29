# Fleeted — Luxury Ride Booking Demo

A four-role ride booking platform: customers book chauffeured luxury cars, vendors accept offers, ops reviews and approves, and drivers complete the journey. Everything updates live over WebSocket — no manual data entry after booking.

```
book → match → accept → approve → drive
```

## Stack

- **Monorepo** — pnpm workspaces, Node ≥ 26
- `packages/shared` — Zod schemas + inferred DTO types + event names (single source of truth for the API contract)
- `packages/server` — Express 5 + Socket.IO + Drizzle ORM on SQLite, layered controllers → services → repositories with a DI container
- `packages/web` — Next.js (App Router) + Tailwind CSS; one app with four role-scoped dashboards

## Quickstart

```bash
pnpm install            # install all workspaces
pnpm dev                # shared (watch) + API (:4000) + web (:3001)
pnpm --filter @fleeted/server seed   # idempotent demo data (accounts, vendors, cars, chauffeurs)
```

Then open http://localhost:3001 and pick a role on the login screen. No `.env` is required — the server defaults to `PORT=4000`, `DB_PATH=./data/fleeted.db`, and a dev JWT secret. See `packages/server/.env.example` and `packages/web/.env.example` to override.

Migrations run automatically on server start. After editing `packages/server/src/db/schema/`, regenerate with `pnpm --filter @fleeted/server db:generate`.

## Commands

| Command                                       | What it does                                                     |
| --------------------------------------------- | ---------------------------------------------------------------- |
| `pnpm dev`                                    | watch all three packages (API :4000, web :3001)                  |
| `pnpm build`                                  | build shared → server → web                                      |
| `pnpm typecheck`                              | tsc across all workspaces                                        |
| `pnpm test`                                   | Vitest suite (server, HTTP integration + WS + domain services)   |
| `pnpm lint` / `pnpm format`                   | ESLint / Prettier checks                                         |
| `pnpm --filter @fleeted/server test:coverage` | Vitest with V8 coverage                                          |
| `pnpm --filter @fleeted/server seed`          | idempotent demo seeding                                          |
| `./scripts/demo-api.sh`                       | full HTTP lifecycle acceptance run (server on :4000 + seeded DB) |

## Architecture

Single Express server serves REST + WebSocket. The web app is a thin client: four dashboards reading the same APIs and subscribing to role-scoped Socket rooms.

```
web (customer / vendor / ops / driver) ──REST + JWT + WS──▶ Express API
                                                          controllers → services → repositories → SQLite
                                                          domain events → Socket.IO fan-out + notifications
```

`packages/shared` defines contract schemas and the `WS_EVENTS` map; the server validates every request against them and maps entities to the same DTO types the web app uses, so the two sides can't drift. Service side effects (notifications, socket pushes) flow through typed domain events, keeping services decoupled from the transport.

State machine: `PENDING → MATCHING → CONFIRMED → STARTED → COMPLETED` (with `CANCELLED` from PENDING/MATCHING/CONFIRMED). Offers: `PENDING → ACCEPTED` (vendor) → ride `CONFIRMED` (ops approves, rejecting all others). Cancellation releases offers and frees cars/chauffeurs.

See `architecture.md` for the full design and `plan.md` for scope.

## Demo walkthrough

Login is a role switcher over seeded Indian-name accounts (role + name, no passwords).

### Seeded accounts

| Role     | Name                       | Login name                 |
| -------- | -------------------------- | -------------------------- |
| CUSTOMER | Priya Nair                 | `Priya Nair`               |
| CUSTOMER | Arjun Mehta                | `Arjun Mehta`              |
| OPS      | Operations lead            | `Ananya Desai`             |
| VENDOR   | Fleeted Company Fleet      | `Fleeted Company Fleet`    |
| VENDOR   | Mumbai Luxury Chauffeurs   | `Mumbai Luxury Chauffeurs` |
| VENDOR   | Royal Rides India          | `Royal Rides India`        |
| VENDOR   | Heritage Carriages         | `Heritage Carriages`       |
| DRIVER   | Rohan Verma (Fleeted Co.)  | `Rohan Verma`              |
| DRIVER   | Arjun Khanna (Royal Rides) | `Arjun Khanna`             |
| DRIVER   | Vikram Rao (Mumbai Luxury) | `Vikram Rao`               |

All chauffeurs of a vendor are also DRIVER logins (e.g. Sanjay Patil, Manish Gupta, Prakash Mishra).

### The story (4 browsers, 4 tabs, zero refresh)

1. **Customer** (`Priya Nair`) — browse the catalog, book a Mercedes S-Class from Taj Palace to JW Marriott.
2. **Vendor** (`Fleeted Company Fleet`) — the request appears instantly under _Ride requests_; accept it with an available car + chauffeur.
3. **Ops** (`Ananya Desai`) — the ride shows on the board as MATCHING; open it, approve the accepted offer (ride confirms, other offers are rejected live).
4. **Driver** (`Rohan Verma`) — the assigned ride is already on the schedule; _Start ride_ → confirm → _Complete ride_.

Watch every dashboard update without refreshing — statuses flip, cars/chauffeurs lock and free, and the customer's ride card tracks the journey. Try branching: book a Lincoln (Royal Rides matches), cancel after accept (offers RELEASED, car freed), or request the Vintage Rolls (only Heritage Carriages qualifies).

### API acceptance run

```bash
pnpm --filter @fleeted/server seed
pnpm --filter @fleeted/server dev &    # keep :4000 running
./scripts/demo-api.sh                   # full lifecycle over HTTP with assertions
```

## Testing

`pnpm test` runs 67 tests (Vitest): domain services (matching, offers, rides, ops, driver, vendor, auth), the HTTP integration suite (happy path, cancel-after-accept, role matrix, validation), and the Socket.IO gateway fan-out. Tests boot the real HTTP + WS servers on in-memory SQLite with seed data — no external services required. Coverage (`test:coverage`): 88% statements overall, all domain services ≥ 80%.

Frontend has no automated tests; it is verified through the shared contract types, typecheck, build, and the API-level walkthrough.
