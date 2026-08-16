# Phase 10 — Vendor Dashboard (`/vendor`)

**Estimated effort:** 5–6 hours

## Objective

The vendor's portal: live ride-request notifications for models they carry, one-click accept with car + chauffeur pickers, fleet availability management, and offer history.

## Dependencies

Phase 8 (foundation).

## Tasks

- [ ] Live request stream: `useSocket` `ride:new` → toast + top-of-list `RideRequestCard` (model, pickup/dropoff, time, price, distance) with count badge; persisted pending offers via `useVendorOffers(vendorId)`
- [ ] Accept flow: click an offer → modal with two pickers from `GET /vendors/:id/cars`:
  - [ ] Car picker (available cars only: `vendorCar.isAvailable` + matches requested model)
  - [ ] Chauffeur picker (AVAILABLE chauffeurs only)
  - [ ] Submit → `POST /offers/:id/accept` → card moves to "Awaiting ops approval"
- [ ] `offer:accepted`/`ride:confirmed`/`ride:cancelled`/`ride:released` updates: toast + card state transitions; `ride:confirmed` shows "Your offer was approved 🎉" state (rejected offers show REJECTED state)
- [ ] Fleet panel: `GET /vendors/:id/cars` list with per-car availability toggle (`POST .../availability`), chauffeurs list with statuses
- [ ] Ride history tab: rides where this vendor holds an offer (accepted/rejected/released/confirmed) with final status
- [ ] Notifications drawer (same pattern as Phase 9)

## Deliverables

- Vendor portal where availability + assignment replaces phone calls — the core of the automation story

## Definition of Done

- [ ] New booking for a model this vendor carries appears live with zero refresh
- [ ] Accept with car+chauffeur succeeds; ops approval/rejection updates the card live
- [ ] Toggling a car off removes it from the picker immediately

## Notes

- A vendor only sees offers for rides matching their fleet (server-scoped via `vendorId` from JWT).
- The company fleet logs in through this same dashboard (it is a vendor) — one extra demo talking point.