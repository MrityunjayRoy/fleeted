# Phase 7 — Real-Time Layer (Socket.IO Gateway + Event Fan-Out)

**Estimated effort:** 3–4 hours

## Objective

Push domain events to the right dashboards in real time: vendors get ride requests, ops sees offers, drivers get assignments, customers get status changes — plus persisted notifications alongside every push.

## Dependencies

Phase 5 (domain events), Phase 6 (REST auth for handshake reuse).

## Tasks

- [ ] Add deps: `socket.io`, `socket.io-client` (dev, for tests)
- [ ] `ws/gateway.ts`:
  - [ ] Attach Socket.IO server to the Express HTTP server (`server.ts`)
  - [ ] Handshake auth: JWT from `auth.token` → map to rooms: `customer:{userId}` / `driver:{userId}` / `vendor:{vendorId}` / `ops`
  - [ ] `EventBus` subscription → emit mapping:
    - [ ] `RideCreated` → `ride:new` to each matched `vendor:{id}`
    - [ ] `OfferAccepted` → `offer:accepted` to `ops`
    - [ ] `RideConfirmed` → `ride:confirmed` to `driver:{chauffeurId}`, `customer:{id}`, `ops`
    - [ ] `RideCancelled` → `ride:cancelled` to involved vendor/driver/customer rooms + `ops`
    - [ ] `RideStarted` / `RideCompleted` → respective rooms
  - [ ] Ack pattern: emit back to actor room on successful action (`offer:accepted`, `ride:started`, `ride:completed` confirmations)
  - [ ] `error` event to acting room on thrown domain errors during socket-driven flows
- [ ] Notification persistence hooked to the same EventBus (NotificationService) so every push is also stored
- [ ] `GET /api/notifications` + `markRead` already wired in Phase 6 — verify join with WS payloads
- [ ] Test (vitest + socket.io-client):
  - [ ] vendor receives `ride:new` on booking
  - [ ] driver + customer receive `ride:confirmed` after ops approval
  - [ ] all parties receive `ride:cancelled` on cancel-after-accept

## Deliverables

- Live event stream to all four dashboards with per-role rooms
- Event→notification parity (WS push + persisted row for every event)

## Definition of Done

- [ ] WS tests pass; typecheck green
- [ ] Restarting the server after a ride-confirm still shows that event in `GET /notifications` (persistence parity)

## Notes

- No business logic in the gateway — it is a pure port from EventBus to sockets.
- Demo scope: no reconnection/backoff UI polish; `socket.io-client` handles basic reconnect automatically.
