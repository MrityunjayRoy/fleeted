# Phase 12 — Driver Dashboard (`/driver`)

**Estimated effort:** 3–4 hours

## Objective

The chauffeur's view: upcoming assigned rides with vendor + car details, live assignment notifications, and start/complete actions that update the whole system.

## Dependencies

Phase 8 (foundation).

## Tasks

- [ ] Upcoming schedule: `useMyRides()` (driver-scoped) — rides CONFIRMED/STARTED sorted by pickup time; cards show model, pickup/dropoff, time, customer name, **vendor name + phone** (who's providing the car), plate number
- [ ] Live assignment: `ride:confirmed` → toast "New ride assigned" + card appears in schedule (via SWR mutate)
- [ ] Start flow: `POST /driver/rides/:id/start` (confirm dialog, car+chauffeur match check) → card flips to STARTED live
- [ ] Complete flow: `POST /driver/rides/:id/complete` → card moves to Completed history, status propagates to ops/customer live
- [ ] History tab: completed/cancelled rides (driver-scoped)
- [ ] Notifications drawer (driver room)
- [ ] Status states: today's schedule vs upcoming; empty state ("No rides assigned yet — when ops approves an offer, it appears here instantly")

## Deliverables

- Driver side completing the four-role loop: book → match → accept → approve → drive

## Definition of Done

- [ ] A ride confirmed by ops appears on the driver's schedule instantly (no refresh)
- [ ] Start → Complete flips status live; ops board and customer ride card update in real time
- [ ] Driver can see vendor name/phone and plate for every assigned ride

## Notes

- Driver identity maps to `chauffeurId` in the JWT; server scopes all queries by it.
- `ride:cancelled` events remove/flag rides in the schedule immediately.