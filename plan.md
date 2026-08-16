# Luxury Ride Booking — Demo Execution Plan

## Goal

Automate the manual ride-ops workflow for a luxury ride booking business (weddings & events):

> Customer books a ride in the app → vendors with the requested car model are notified automatically → vendor assigns a car + chauffeur → operations team reviews & approves → driver is notified → ride completes. Zero manual data entry.

Build a fully TypeScript, production-grade-style demo: **Express backend + Next.js frontend** in a pnpm monorepo, with 4 role dashboards (Customer, Vendor, Operations, Driver) and real-time notifications over WebSocket.

## Scope

**In scope**

- Ride booking by customer (model, pickup/dropoff, time, distance, price)
- Automatic vendor matching on booking (vendor must have the model, an available car, an available chauffeur)
- Vendor accept flow: pick a specific car + chauffeur
- Operations approval flow (approve one offer → ride confirmed, others rejected)
- Driver start/complete flow with live status propagation
- Cancellation by customer or ops (including cancel-after-vendor-accepted: offers released, all parties notified)
- Persisted in-app notifications + real-time push over Socket.IO
- Company own fleet modeled as a vendor (`isCompany: true`) so it participates in matching like any vendor
- Seeded demo data, role-switcher auth (JWT), Vitest tests for core flows
- DB access behind repository interfaces so SQLite can be swapped for Postgres/Mongo later

**Out of scope (demo)**

- Real multi-user auth / passwords / OAuth
- Payments & invoices
- Complex fare engine (flat base + per-km only)
- Multi-round vendor fallback matching (single matching pass at booking time)
- Maps / geolocation / live tracking
- Admin CRUD for models & vendors (seeded only)

## Tech stack decisions

| Concern    | Decision                                                                    |
| ---------- | --------------------------------------------------------------------------- |
| Repo       | pnpm monorepo: `packages/server`, `packages/web`, `packages/shared`         |
| Backend    | Express (TypeScript, strict)                                                |
| Frontend   | Next.js App Router + Tailwind                                               |
| Real-time  | Socket.IO (server push to role rooms)                                       |
| DB         | SQLite via Drizzle ORM, behind repository interfaces (facade)               |
| Validation | Zod schemas shared between server & web (`packages/shared`)                 |
| DI         | Hand-rolled composition root (typed factories, no decorators)               |
| Events     | Typed in-process domain events; WS gateway + notification service subscribe |
| Auth       | Role-switcher login issuing JWT; middleware enforces role                   |
| Tests      | Vitest + supertest (in-memory SQLite)                                       |
| Tooling    | concurrently for dev, tsc strict typecheck, ESLint + Prettier               |
| Locale     | Seed data in INR with Indian city names & names                             |
| UI         | Plain Tailwind components (no UI library deps)                              |

## Ride lifecycle

```
PENDING → MATCHING → CONFIRMED → STARTED → COMPLETED
               │          │
               └─ CANCELLED ┘   (customer or ops)
```

1. Customer books → matching creates one `RideOffer` (PENDING) per qualifying vendor → `ride:new` pushed to those vendors.
2. Vendor accepts with car + chauffeur → offer `ACCEPTED` → ops notified.
3. Ops approves one offer → ride `CONFIRMED`, other offers `REJECTED`, driver notified.
4. Driver starts → `STARTED`; completes → `COMPLETED`. Status changes notify customer + ops live.
5. Cancel (customer or ops) → releases all offers, frees car/chauffeur, notifies every involved party.

## Work breakdown — phases

All phase documents live in `exec/` and are the authoritative execution detail.

| #   | Phase                            | Major deliverable                                                              | Est. effort | Depends on |
| --- | -------------------------------- | ------------------------------------------------------------------------------ | ----------- | ---------- |
| 1   | Monorepo scaffolding & tooling   | Workspace boots: Express hello + Next hello run together                       | 2–3h        | —          |
| 2   | Shared package (schemas & types) | Zod DTOs + enums shared by server & web                                        | 3–4h        | 1          |
| 3   | Database facade                  | Drizzle schema, migrations, repository interfaces + SQLite impls, DI container | 6–8h        | 2          |
| 4   | Auth & seed data                 | Role-switcher JWT login, guards, seeded vendors/cars/chauffeurs/users          | 3–4h        | 3          |
| 5   | Domain services                  | Matching, rides, offers, ops approval, driver, cancellation + domain events    | 6–8h        | 4          |
| 6   | REST API                         | Controllers, routes, validation, error handling, response DTOs                 | 4–5h        | 5          |
| 7   | Real-time layer                  | Socket.IO gateway, role rooms, event fan-out                                   | 3–4h        | 5          |
| 8   | Frontend foundation              | Next app shell, login, API client, SWR + socket hooks, UI primitives           | 5–6h        | 2, 6       |
| 9   | Customer dashboard               | Model catalog, booking form, my rides, live status                             | 4–5h        | 8          |
| 10  | Vendor dashboard                 | Ride-request stream, accept with car+chauffeur, availability toggles           | 5–6h        | 8          |
| 11  | Ops dashboard                    | Auto-populated ride oversight, offer approval, cancellation                    | 5–6h        | 8          |
| 12  | Driver dashboard                 | Assigned rides, start/complete, live notifications                             | 3–4h        | 8          |
| 13  | Tests, hardening & demo polish   | Full test suite, green typecheck/build, demo runbook + README                  | 5–6h        | 3–12       |

**Total estimated effort:** ~55–73 hours.

## Milestones

- **M1 (phases 1–4):** Repo boots, DB facade + auth ready, seeded.
- **M2 (phases 5–7):** Full backend: booking → matching → accept → approve → drive lifecycle over REST + WebSocket.
- **M3 (phases 8–12):** All four role dashboards functional and live-connected.
- **M4 (phase 13):** Tests green, docs complete, one-command demo.

## Definition of done (project)

- `pnpm typecheck` passes in all packages (strict TS, zero errors)
- `pnpm test` green: unit + integration coverage of the full ride lifecycle
- `pnpm dev` runs server + web together; demo walkthrough works end-to-end
- README + `exec/` docs describe architecture, API, WS events, and demo runbook
