# Phase 3 — Database Facade (SQLite via Drizzle + Repository Interfaces)

**Estimated effort:** 6–8 hours

## Objective

Stand up the swappable persistence layer: Drizzle schema + migrations for SQLite, repository **interfaces** (the facade), SQLite implementations, and a DI composition root wiring them.

## Dependencies

Phase 2 (shared types for enums used in schema).

## Tasks

- [ ] Add deps: `drizzle-orm`, `better-sqlite3`, `drizzle-kit` (+ types)
- [ ] `db/client.ts` — `createDbClient(dbPath | ':memory:')` returning typed drizzle instance; single place DB driver is chosen
- [ ] `drizzle.config.ts` + `db/migrations/`; scripts `db:generate` / `db:migrate`
- [ ] Schema (`db/schema/`):
  - [ ] `users` (customer accounts: id, name, phone, email)
  - [ ] `vendors` (id, name, phone, isCompany)
  - [ ] `car_models` (id, name, category, basePrice, pricePerKm, capacity, description)
  - [ ] `vendor_cars` (id, vendorId FK, modelId FK, plateNumber, isAvailable)
  - [ ] `chauffeurs` (id, vendorId FK, name, phone, licenseNumber, status)
  - [ ] `rides` (id, customerId FK, modelId FK, pickup, dropoff, pickupTime, distanceKm, price, status, timestamps: createdAt/confirmedAt/startedAt/completedAt/cancelledAt)
  - [ ] `ride_offers` (id, rideId FK, vendorId FK, vendorCarId FK?, chauffeurId FK?, status, timestamps)
  - [ ] `notifications` (id, recipientRole, recipientId?, type, message, payload, read, createdAt)
- [ ] Indexes: `rides.status`, `ride_offers.rideId`, `ride_offers.vendorId`, `notifications.(recipientRole, recipientId)`
- [ ] Repository interfaces (`db/interfaces/`): `IUserRepository`, `IVendorRepository`, `ICarModelRepository`, `IVendorCarRepository`, `IChauffeurRepository`, `IRideRepository`, `IRideOfferRepository`, `INotificationRepository` — methods return/accept domain types, never raw rows
- [ ] Drizzle implementations (`db/repositories/`) for all interfaces; joins encapsulated (e.g., `RideRepository.findWithParticipants(id)`)
- [ ] `config/container.ts` — composition root: `createContainer(env)` typed factory returning `{ repos, ... }`; bind interface → impl
- [ ] Smoke test: in-memory DB, insert a vendor + car + chauffeur via repos, read back, assert types

## Deliverables

- Migrated SQLite schema + migrations artifact
- Full repository facade with zero SQL leaking into services
- DI container wiring repositories

## Definition of Done

- [ ] `pnpm typecheck` exits 0
- [ ] Repo smoke test passes (vitest)
- [ ] Swapping to Postgres requires only: new connection config + dialect; Mongo requires new repo impls against the same interfaces (documented in `architecture.md §8`)

## Notes

- `:memory:` mode is the test seam; the container takes a db path so tests inject `:memory:`.
- Ride timestamps stored as ISO strings (UTC) for SQLite simplicity; Postgres swap can switch to native timestamps inside the repository layer only.