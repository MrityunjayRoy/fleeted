# Phase 11 — Ops Dashboard (`/ops`)

**Estimated effort:** 5–6 hours

## Objective

The operations console: a fully auto-populated oversight board — every ride, every vendor offer, every chauffeur/car detail — where the only actions left are approve, reject, and cancel. **No manual data entry exists anymore.**

## Dependencies

Phase 8 (foundation).

## Tasks

- [ ] Overview stats row: counts by status (matching, pending offers, confirmed today, completed, cancelled) via `useOpsRides()`
- [ ] Rides table: filters by status + search by customer/vendor/model; columns: ride id, model, customer, pickup/dropoff/time, price, current status, # offers
- [ ] Ride detail drawer (`GET /ops/rides/:id`):
  - [ ] Customer block (name, phone)
  - [ ] Ride block (route, time, distance, price, timestamps)
  - [ ] Offers list — one card per vendor: vendor name (company fleet flagged), car (plate + model), chauffeur (name + phone), offer status badge
  - [ ] Actions: **Approve** on ACCEPTED offers (→ confirm ride, reject others — confirm dialog explaining consequences), **Cancel ride** (with reason note)
- [ ] Live updates: `offer:accepted` (toast + offers row appears), `ride:confirmed`, `ride:started`, `ride:completed`, `ride:cancelled` all mutate the table; approve/reject reflect instantly
- [ ] Notifications drawer (ops room) with mark-read
- [ ] Empty/loading/error states for every list

## Deliverables

- The automated ops console — the reason this project exists

## Definition of Done

- [ ] Book + vendor accept appears on the ops board with zero manual entry (only via WS, no refresh)
- [ ] Approving one of multiple offers confirms the ride and visibly rejects the rest
- [ ] Cancellation releases offers and reflects live

## Notes

- Approve is race-safe server-side (Phase 5); UI disables approve once the ride leaves MATCHING.
- This dashboard demonstrates the before/after: previously this table was filled by hand after phone calls.
