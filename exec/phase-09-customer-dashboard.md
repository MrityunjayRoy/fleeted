# Phase 9 — Customer Dashboard (`/`)

**Estimated effort:** 4–5 hours

## Objective

The booking side: browse the catalog with prices, book a ride, watch it flow through matching → confirmation → completion live, and cancel.

## Dependencies

Phase 8 (foundation).

## Tasks

- [ ] Catalog section: `useCarModels()` grid — name, category badge, base price + per-km rate, capacity; select a model → booking form
- [ ] Booking form: pickup, dropoff, pickup time (datetime-local, must be future), distance (km input for demo), notes; submit → `POST /rides` → success → live `RideDto` appears in "My rides"
- [ ] My rides: `useMyRides()` list; each ride card shows: status badge, model, price breakdown (base + distance), pickup/dropoff/time, assigned vendor/chauffeur/car when confirmed, timestamps
- [ ] Live updates via `useSocket`: `ride:confirmed` / `ride:started` / `ride:completed` / `ride:cancelled` → mutate SWR + toast
- [ ] Cancel button on rides in PENDING/MATCHING/CONFIRMED/STARTED (customer rule: not after completion) with confirm dialog; `POST /rides/:id/cancel`
- [ ] Status timeline strip on each ride card (Booked → Vendor offer → Confirmed → Started → Completed) highlighting current state
- [ ] Notifications drawer: `useNotifications()`, mark-read, live appends

## Deliverables

- Customer dashboard demonstrating the *book → wait for vendor/ops → confirmed* flow end-to-end

## Definition of Done

- [ ] Booking a seeded model yields a MATCHING ride; vendor accept + ops approve (done in other dashboards or via curl) flips the card to CONFIRMED live without refresh
- [ ] Cancellation (incl. after vendor accepted) updates the card to CANCELLED live
- [ ] Typecheck green, no console errors

## Notes

- Distance is manually entered for the demo (no maps integration).
- Price is computed server-side; the form shows an estimate before submit.