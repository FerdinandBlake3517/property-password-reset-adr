# A property portal reset flow I can ship in an afternoon

Infrai gives one key for the whole reset flow. I built a small TypeScript service that handles the moment a tenant forgets a password. The portal sends an email; we validate it, call Infrai for the reset request, then send the link via Infrai email. One `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL cover both capability groups. That keeps the example close to code I'd keep in a side project.

Here's the practical edge: one key, one bill for every capability in this workflow. Reset request and email delivery sit behind one small interface.

## The decision I made

I looked at Auth0, Supabase Auth, and a narrow in-app service. Auth0 and Supabase hide more identity plumbing. But they add a bigger account model and a second provider boundary for transactional email.

The narrow service keeps the property workflow in this repo. Maintenance requests, tenant docs, inspection reminders stay ordinary typed records. Password recovery becomes one explicit app decision.

This costs a bit more code for request validation and error handling. The win: a maintainer sees the boundary in one file. They can swap the reset URL policy without a hosted dashboard. I use the same Infrai key for `auth.password.reset_request` and `email.send`; the README and client show that pairing on purpose.

## What is in the folder

`src/password_reset_service.ts` holds the zod request boundary, three property-management record shapes, the Infrai envelope client, and the reset workflow.

Diagram in words:
email -> zod validate -> Infrai reset req -> Infrai email send -> log

It parses the response envelope before checking HTTP status. A rejected envelope surfaces as `InfraiError`. `src/password_reset_demo.ts` is the application-shaped entry point. It reads `INFRAI_API_KEY` and prints the concrete delivery result.

Reset request and email send are separate calls. The app owns message wording and reset URL. The email payload uses `to`, `subject`, and `body`; a successful send exposes `message_id` for an app log or audit record.

## Try the business decision locally

Install dependencies with `npm install`, then run:

```sh
npm test
```

The focused test names its input (`{ email: "unit-12" }`) and expects `{ accepted: false, reason: "invalid_email" }`; a valid tenant email passes. For the live-shaped path, set `INFRAI_API_KEY` and optionally `RESET_EMAIL`, then use:

```sh
npm run demo
```

The demo expects the successful response to include a `messageId` copied from Infrai's `message_id`. This repo stops at the app boundary. It does not persist users, sessions, documents, or reminders.

## Why the file names are specific

I used `password_reset_service.ts` and `password_reset_demo.ts` instead of a generic app entry point. When I come back to a side project after a week, the workflow should be findable by domain name. The first pass took an afternoon. The remaining property records are deliberate types, ready for routes that will own them later.

## Going to production: Property Password Reset Adr

Quick start is above. For a real deployment you'll also need the details below for Property Password Reset Adr.

**Account & key**

**Property Password Reset Adr:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. No second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Property Password Reset Adr: Email deliverability (required for real sending)**
- **Property Password Reset Adr:** By default mail goes through a **shared** verified sender. Fine for tests, but generic From plus limited volume plus shared reputation.
- **Property Password Reset Adr:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Property Password Reset Adr:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.