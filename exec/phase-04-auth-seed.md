# Phase 4 — Auth (Role Switcher) & Seed Data

**Estimated effort:** 3–4 hours

## Objective

Role-switcher JWT auth (login → token, role-guarded middleware) and a rich, idempotent seed script so every role has demo accounts and every booking matches instantly.

## Dependencies

Phase 3 (repositories + container).

## Tasks

- [ ] Add deps: `jsonwebtoken`, `@types/jsonwebtoken`; `JWT_SECRET` in `config/env.ts` (zod-validated)
- [ ] `middleware/auth.ts` — parse `Authorization: Bearer`, verify JWT, attach `AuthContext { userId, role, vendorId?, driverId? }` to request
- [ ] `middleware/require-role.ts` — factory `requireRole(Role | Role[])` returning 403 with typed error on mismatch
- [ ] `services/auth.service.ts` — `login(LoginRequest)` resolves the seeded account by role+name, returns `AuthResponse { token, role, userId, displayName }` (no passwords in demo)
- [ ] `POST /api/auth/login` + `GET /api/auth/me` (token introspection for app boot)
- [ ] `db/seed.ts` (idempotent — upsert by stable keys):
  - [ ] 5 car models: Mercedes S-Class, Rolls-Royce Ghost, Range Rover Autobiography, Lincoln Town Car, Vintage Rolls-Royce Silver Cloud (categories: Sedan / SUV / Limousine / Vintage); prices in ₹ (base + per-km)
  - [ ] 3 external vendors + company fleet vendor (`isCompany: true`)
  - [ ] 2–4 cars and 2–4 chauffeurs per vendor (realistic Indian names); availability flags tuned so every model has ≥1 vendor with available car + available chauffeur
  - [ ] Demo accounts: 2 customers, 1 ops manager, 1 vendor account per vendor, 1 chauffeur account per chauffeur (role + foreign keys wired)
- [ ] `pnpm seed` script (fresh DB → migrate → seed)
- [ ] Unit test: login returns valid JWT; requireRole rejects wrong role

## Deliverables

- JWT auth with role guards; demo accounts for all four dashboards
- Deterministic demo data enabling the full lifecycle demo

## Definition of Done

- [ ] `POST /auth/login` returns token; guarded route returns 403 for wrong role
- [ ] `pnpm seed` runs clean on a fresh DB and is re-runnable
- [ ] Every model in the catalog is matchable at booking time (≥1 vendor with available car + chauffeur)

## Notes

- JWT payload: `{ sub: userId, role, vendorId?, chauffeurId? }`, expiry 24h for demo.
- Seed IDs are stable strings (e.g., `vendor-company`, `chauffeur-company-1`) so demos and tests reference known accounts.
