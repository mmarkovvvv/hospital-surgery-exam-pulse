# Agent rules

## TDD and delivery

- For every new access-control or entitlement rule, write a failing unit test first.
- Keep authorization decisions in pure, directly tested functions before wiring them into Payload collections or React components.
- Run `npm run test:int`, `npm run lint`, and `npm run build` from `platform/` before declaring a full-stack change complete.
- Add an end-to-end test for every user-visible authentication or visibility flow.
- Do not place payment secrets, Payload secrets, or service-role credentials in client code or committed files.

## Access model

- The browser is never trusted to decide whether content is paid.
- Public content must be explicitly marked `public` and `published`.
- Registration-only content requires an authenticated user.
- Subscription content requires an active entitlement checked on the server.
- Admin-only fields such as roles and entitlements must not be writable through public registration.

## Safe migration

- Keep the existing static study app working while the `platform/` application is developed.
- Prefer small vertical slices: model, access policy, API, UI, tests.
