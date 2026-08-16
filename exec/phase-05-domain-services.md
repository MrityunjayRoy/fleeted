# Phase 5 — Domain Services & Ride Lifecycle

**Estimated effort:** 6–8 hours

## Objective

All business logic, isolated from HTTP and WebSocket: booking, matching, vendor accept, ops approval, driver start/complete, cancellation — expressed as typed domain events with transactional guards.

## Dependencies

Phase 4 (auth context, seed, container).

## Tasks

- [ ] `domain/errors/`: `AppError(status, code, message)` base + typed errors:
  - [ ] `NotFoundError`, `ValidationError`
  - [ ] `CarNotAvailableError`, `ChauffeurNotAvailableError`, `OfferAlreadyAcceptedError`, `OfferNotPendingError`
  - [ ] `RideStateTransitionError` (e.g., cancel a completed ride)
  - [ ] `InsufficientVendorAccessError`
- [ ] `domain/events.ts` — typed `DomainEvent` union + `EventBus` (typed EventEmitter wrapper, `on`/`emit` with event-name literal types)
- [ ] `services/matching.service.ts`:
  - [ ] `match(ride)` — find vendors: has vendorCar of model with `isAvailable` + has AVAILABLE chauffeur
  - [ ] Create one `RideOffer`(PENDING) per qualifying vendor; ride → MATCHING
  - [ ] Emit `RideCreated` with matched vendorIds
- [ ] `services/ride.service.ts`:
  - [ ] `create` — price = basePrice + distanceKm × pricePerKm (validate model exists, pickupTime in future)
  - [ ] `cancelByCustomer` / `cancelByOps` — release all offers (RELEASED), restore car/chauffeur availability, ride → CANCELLED, emit `RideCancelled`
  - [ ] `getMine(actor)` role-scoped listing (customer rides / driver rides / vendor rides via offers)
- [ ] `services/offer.service.ts`:
  - [ ] `accept(offerId, vendorId, { vendorCarId, chauffeurId })` — guards: offer PENDING, car belongs to vendor + available, chauffeur belongs to vendor + AVAILABLE; lock both; offer → ACCEPTED; emit `OfferAccepted`
  - [ ] `rejectRemaining(rideId, winningVendorId)` — used by approval
- [ ] `services/ops.service.ts`:
  - [ ] `approveOffer(offerId)` — offer must be ACCEPTED; ride → CONFIRMED (set confirmedAt); other offers → REJECTED; release locks on non-winning cars/chauffeurs; emit `RideConfirmed` (with chauffeurId for driver room)
  - [ ] `listRides(filter)` / `getRideDetail(id)` with full participant join
  - [ ] `approve` must be **race-safe**: second approve on same ride throws `RideStateTransitionError`
- [ ] `services/driver.service.ts`: `start(rideId, chauffeurId)` → STARTED; `complete(...)` → COMPLETED, free car/chauffeur; guards on ownership + status; emit `RideStarted` / `RideCompleted`
- [ ] `services/notification.service.ts`: `persist(domainEvent)` — maps event → `Notification` row (recipientRole/recipientId/type/message/payload); `listFor(actor)`, `markRead(ids)`
- [ ] Wire all services into `config/container.ts` (constructor-injected repos + EventBus)
- [ ] Unit tests (vitest, in-memory DB):
  - [ ] Matching: qualifies only vendors with model + available car + available chauffeur
  - [ ] Cancel-after-accept: offers RELEASED, car/chauffeur freed, notification rows created
  - [ ] Approve race: second approve throws
  - [ ] Price calculation correctness

## Deliverables

- Fully typed domain layer with the complete ride lifecycle
- Every state change emits a domain event (single source for WS + notifications)

## Definition of Done

- [ ] `pnpm typecheck` exits 0
- [ ] Unit tests above pass
- [ ] No service imports from `db/repositories` (only interfaces) and nothing from `ws/` or `controllers/`

## Notes

- Services are pure of HTTP/WS concerns by construction; the event bus is the only cross-cutting channel.
- All multi-entity mutations (approve, cancel) run in a transaction (`withTransaction` helper on the container, SQLite transactions for now).