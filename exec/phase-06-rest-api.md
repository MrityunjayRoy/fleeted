# Phase 6 — REST API Layer (Controllers, Routes, DTOs, Error Handling)

**Estimated effort:** 4–5 hours

## Objective

Expose the domain layer over HTTP with zod validation at the boundary, typed response DTO mappers, and consistent error responses — the entire lifecycle must work end-to-end via curl.

## Dependencies

Phase 5 (services + events).

## Tasks

- [ ] `middleware/validate.ts` — `validate(schema)` factory: parse `req.body`/`req.params`/`req.query`, 400 with zod issues on failure
- [ ] `middleware/error-handler.ts` — global handler: `AppError` → `{ error: { code, message } }` + status; zod → 400 details; unknown → 500 (logged, generic body)
- [ ] `dto/mappers.ts` — `toRideDto`, `toRideOfferDto`, `toCarModelDto`, `toVendorDto`, `toChauffeurDto`, `toVendorCarDto`, `toNotificationDto`; embed participant summaries where the UI needs them
- [ ] Controllers (thin — parse → service → map → respond):
  - [ ] `auth.controller` — login, me
  - [ ] `catalog.controller` — car models
  - [ ] `ride.controller` — create, mine, get, cancel
  - [ ] `offer.controller` — accept, get, listByVendor
  - [ ] `vendor.controller` — cars list, availability toggle
  - [ ] `ops.controller` — list rides, ride detail, approve offer, cancel ride
  - [ ] `driver.controller` — start, complete, my rides
  - [ ] `notification.controller` — list, markRead
- [ ] Route wiring in `routes/` with `requireRole` guards per the architecture API table
- [ ] `app.ts` assembly: helmet, cors (dev), json, morgan-style logging, routes, 404, error handler
- [ ] Manual end-to-end verification via curl script (`scripts/demo-api.sh`): login ×4 roles → book → accept → approve → start → complete, assert status codes + bodies
- [ ] Integration tests (supertest, in-memory DB): full lifecycle + cancel-after-accept + role guard 403s + validation 400s

## Deliverables

- Complete REST surface per `architecture.md §6`
- Curl-runnable proof the automation pipeline works without the frontend

## Definition of Done

- [ ] `pnpm typecheck` + tests green
- [ ] `scripts/demo-api.sh` completes the full lifecycle with expected statuses
- [ ] Every error path returns the typed error envelope (spot-checked in tests)

## Notes

- Response DTOs come from `packages/shared`; controllers never return entities.
- The curl script doubles as the backend acceptance test for later phases.
