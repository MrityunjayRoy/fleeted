# Phase 8 — Frontend Foundation (App Shell, Auth, Data & Socket Plumbing)

**Estimated effort:** 5–6 hours

## Objective

Give the Next.js app a working shell: login page, auth context, typed API client, SWR hooks, a `useSocket` hook, and shared UI primitives — so the four dashboards (Phases 9–12) are pure feature work.

## Dependencies

Phases 2 (shared types), 6 (REST), 7 (WS events).

## Tasks

- [ ] Add deps: `swr`, `socket.io-client`, `tailwindcss` (v4), minimal component kit (plain Tailwind primitives, no heavy UI lib)
- [ ] `lib/api.ts` — typed fetch client: base URL from env (`NEXT_PUBLIC_API_URL`), JWT header injection, error envelope parsing, generic `ApiError`
- [ ] `lib/auth.tsx` — AuthProvider: login(page) → stores `{ token, role, userId, name }` in localStorage; `useAuth()`; route-level guard (redirect to `/login`)
- [ ] `app/login/page.tsx` — role picker: choose role → list seeded accounts for that role → login → redirect to that role's dashboard
- [ ] `lib/swr-hooks.ts` — typed hooks: `useCarModels()`, `useMyRides()`, `useVendorOffers(vendorId)`, `useOpsRides()`, `useOpsRideDetail(id)`, `useNotifications()`, each typed against shared DTOs
- [ ] `lib/useSocket.ts` — hook: connect with JWT, expose typed event subscriptions (map of WS event → callback), auto-mutate SWR caches on events (`useSWRConfig().mutate`), toast on key events
- [ ] Shared UI primitives: `StatusBadge` (per RideStatus/OfferStatus colors), `Card`, `Button`, `Spinner`, `ToastStack`, `EmptyState`, `SectionHeader`
- [ ] Root layout: providers (Auth, SWR, Toast), consistent sidebar/topbar with role switching and logout
- [ ] Stub each dashboard route (`/`, `/vendor`, `/ops`, `/driver`) with a "coming in Phase N" placeholder behind auth guard

## Deliverables

- Logged-in app shell with live data plumbing ready for feature dashboards

## Definition of Done

- [ ] Login as any seeded role redirects to its dashboard; refresh keeps session
- [ ] `useSocket` connects with JWT and a manual test push from server updates SWR cache (verified in browser console)
- [ ] All four dashboards render stubs without console errors

## Notes

- All UI types imported from `packages/shared` — no local type re-declarations.
- WS event names centralized in a constant map shared with the gateway (single source).