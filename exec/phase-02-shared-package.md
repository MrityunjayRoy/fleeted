# Phase 2 — Shared Package: Zod Schemas & DTO Types

**Estimated effort:** 3–4 hours

## Objective

Define every cross-boundary type once in `packages/shared` — enums, request schemas, response DTO types — and prove the server consumes them with full type safety.

## Dependencies

Phase 1 (scaffolding).

## Tasks

- [ ] Add `zod` dependency to `packages/shared`; set build output (tsup or plain tsc) consumable by both packages
- [ ] Enums: `Role` (CUSTOMER | VENDOR | OPS | DRIVER), `RideStatus`, `OfferStatus` (PENDING | ACCEPTED | REJECTED | RELEASED), `CarCategory`
- [ ] Request schemas (all `z.object` with `strict()`):
  - [ ] `LoginRequest` — role, name (role-switcher)
  - [ ] `CreateRideRequest` — modelId, pickup, dropoff, pickupTime, distanceKm, notes?
  - [ ] `AcceptOfferRequest` — vendorCarId, chauffeurId
  - [ ] `AvailabilityToggleRequest` — isAvailable
- [ ] Response DTO schemas + inferred types: `CarModelDto`, `VendorDto`, `ChauffeurDto`, `VendorCarDto`, `RideDto`, `RideOfferDto`, `NotificationDto`, `AuthResponse`
- [ ] `RideDto` shape: full ride incl. status, price, timestamps, embedded customer summary, and (when set) assigned vendor/car/chauffeur summary
- [ ] Export barrel `index.ts`; add `typecheck` script for shared
- [ ] Server smoke test: import shared types in `app.ts`, typecheck passes

## Deliverables

- `packages/shared` fully typed and built; single source of truth for the API contract
- No inline type duplication between server and web

## Definition of Done

- [ ] Server imports and uses shared types/schemas; `pnpm typecheck` exits 0 for shared + server
- [ ] A zod schema rejects a malformed payload (verified in a unit test or REPL check)

## Notes

- DTOs intentionally exclude internal fields (e.g., no raw password-ish/seed internals, no DB ids beyond what the UI needs).
- Any future contract change is a single-file change here first.