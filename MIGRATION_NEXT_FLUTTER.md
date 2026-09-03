# Wedding Platform Migration — Next.js + Flutter

## Target architecture

- `web/` — Next.js App Router web experience with TypeScript, secure session-aware navigation, responsive design tokens, and miniature-diorama presentation.
- `mobile/` — Flutter cross-platform client sharing the same backend API contract.
- `server/` — Express/MongoDB backend with environment config, httpOnly cookie sessions, refresh-token rotation, RBAC, onboarding enforcement and tenant isolation.
- legacy Vite code remains temporarily during feature-by-feature migration and should be removed only after parity is verified.

## Security changes in this branch

1. Removed the rebuilt clients' dependency on browser `localStorage` authentication.
2. Added short-lived httpOnly access cookies.
3. Added persisted, hashed refresh sessions with token rotation and logout revocation.
4. Added login rate limiting and refresh rate limiting.
5. Added explicit authentication and role middleware.
6. Protected user, client, guest, RSVP and content-management routes.
7. Removed legacy public `/api/login` and `/api/register` routes from the migrated API router.
8. RSVP identity is derived from the authenticated session for guest users instead of trusting `userId` from the browser.
9. Added tenant scoping middleware so organisers cannot switch weddings by sending another `clientId`.
10. Added explicit first-time profile/onboarding state and authenticated `/api/profile` endpoints.
11. Added environment-backed database/CORS/session configuration.
12. Added Helmet, reduced JSON body limit and repository hygiene rules.

## UI migration

The Next.js landing experience includes a responsive open-air 3D miniature wedding diorama with layered mountain, forest, ivory pillar, champagne-gold stage and invitation-board treatments. The structure is intentionally separated into reusable components so higher-fidelity rendered 3D assets can replace individual visual layers without rewriting navigation or business logic.

The Flutter client mirrors the same visual direction and will use the same authenticated API contract for RSVP, seating and accommodation.

## Next implementation phases

- invitation/magic-link token exchange with single-use hashed tokens and expiry
- CSRF token support for cookie-authenticated mutations
- typed RSVP feature module
- real-time seat locking / optimistic concurrency
- room inventory and booking model
- admin RSVP dashboard
- full event/gallery/content migration from legacy Vite components
- replacement of procedural diorama layers with final production 3D assets where desired
- automated tests and CI build checks for web, mobile and server
