# Phase 13 — Tests, Hardening & Demo Polish

**Estimated effort:** 5–6 hours

## Objective

Make the demo credible: full automated test coverage of the lifecycle, zero typecheck/lint/build errors, and a runbook that replays the entire story in minutes.

## Dependencies

Phases 3–12 (everything above).

## Tasks

- [ ] Vitest setup in `packages/server` (existing tests consolidated, `coverage` script, `:memory:` db per suite)
- [ ] Complete unit suites (fill gaps):
  - [ ] MatchingService: qualification rules, no-double-offer, zero-match edge case
  - [ ] OfferService: accept guards (car/chauffeur ownership + availability), double-accept
  - [ ] RideService: price math, cancel-before/after-accept, cancel completed ride → error
  - [ ] OpsService: approve race, reject-others side effects
  - [ ] DriverService: start/complete guards
- [ ] Integration suite (supertest, in-memory DB):
  - [ ] Full happy path: login → book → vendor accept → ops approve → driver start → complete (assert statuses + notifications at each step)
  - [ ] Cancel-after-accept (offers RELEASED, car/chauffeur freed, all parties notified)
  - [ ] Auth matrix: each role hitting every route (200/403 matrix test)
  - [ ] Validation: malformed bodies → 400 with field details
- [ ] WS integration test: socket.io-client asserts `ride:new`, `ride:confirmed`, `ride:cancelled` fan-out (from Phase 7, ensure stable under CI)
- [ ] Hardening pass:
  - [ ] `pnpm typecheck` green across all packages
  - [ ] `pnpm build` green (shared → server → web)
  - [ ] `pnpm lint` + prettier clean
  - [ ] Server boot with no seed → clear error message; migration failure paths handled
- [ ] Demo artifacts:
  - [ ] `README.md` — quickstart (install, env, seed, dev), architecture summary, demo walkthrough script with seeded account table
  - [ ] `scripts/demo-walkthrough.sh` — curl flow (from Phase 6) updated to final API; browser steps documented in README
  - [ ] `.env.example` for server (PORT, JWT_SECRET, DB path) and web (API URL)
- [ ] Final end-to-end rehearsal: fresh clone equivalent (`rm -rf node_modules .next *.db` → `pnpm install` → `pnpm seed` → `pnpm dev`) → run the demo script across all four dashboards

## Deliverables

- Green test suite, clean build, polished demo runbook

## Definition of Done

- [ ] `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm lint` all exit 0
- [ ] Demo walkthrough completes from a clean checkout in under 10 minutes
- [ ] README documents roles, seeded accounts, and the 4-dashboard story

## Notes

- This phase is the quality gate before presenting the demo; any issue found here is fixed here.
- Coverage target: all domain services ≥ 80% statement coverage.