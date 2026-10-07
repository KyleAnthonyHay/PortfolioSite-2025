---
project: SelahNote Creator Dashboard
slug: selahnote-creator-dashboard
type: project
role: solo
status: internal (live for staff and creators at a private sign-in URL)
---

# SelahNote Creator Dashboard

## Overview
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"overview","technologies":["Next.js","React","TypeScript","Convex","Firebase Authentication","RevenueCat","Vercel"]} -->
The SelahNote Creator Dashboard is an internal web app Kyle-Anthony Hay built to run the user-generated content (UGC) creator and referral program for SelahNote, his iOS app for sermon and church note-taking, which has over 400 users. Creators promote SelahNote on social media and share their own App Store offer codes. When someone redeems a creator's code and starts a free trial, RevenueCat sends a webhook to SelahNote's Convex backend. The backend attributes that trial to the creator and records a reward, and the dashboard shows the results live.

Staff use the dashboard to manage creators and their codes, watch referral performance and subscription outcomes (trials, paid conversions, cancellations, refunds), reconcile webhook events, log and track creators' social posts, and record monthly payouts. Every payout is a single idempotent database transaction and is written to an audit trail. Creators can also sign in and see a creator-scoped view of the same pages: their own numbers, their payment history and their own content log.

Kyle built it solo in late September 2026. The referral pipeline and the first version of the dashboard were committed on September 22–23, and payouts, creator access controls and custom date ranges followed through September 28. It runs on Vercel at a custom SelahNote subdomain and reads from the production Convex deployment. It is internal: there is no signup, and access requires an explicitly granted membership. The frontend is Next.js 16 with React 19 and TypeScript. Convex handles real-time queries, mutations, cron jobs and HTTP webhooks, and Firebase Authentication handles sign-in.

## Problem and users
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"problem","technologies":["RevenueCat","App Store offer codes","Convex"]} -->
The SelahNote Creator Dashboard exists because paying creators for referrals is hard to get right without dedicated tooling. SelahNote grows partly through creators who make short-form videos and share App Store offer codes. To pay them fairly, the business has to answer a few questions reliably. Which trials did each creator actually drive? Which of those trials converted, cancelled or were refunded? How much is owed this month, and has it already been paid?

The raw signals are spread across systems. Apple handles offer-code redemption and never reveals the code a customer typed. RevenueCat verifies subscriptions and sends lifecycle webhooks. Creators' posts live on TikTok, Instagram and Facebook. Without a single source of truth, the program would run on spreadsheets and manual checks. That invites double payments, missed rewards and disputes that nobody can resolve.

The dashboard serves three groups:
- **Owners** manage who has access and can revoke staff or creator logins.
- **Staff (admins and viewers)** manage creators and offer codes, reconcile events, review the reward ledger and record payouts. Viewers can read but not write.
- **Creators** sign in to see only their own trials, earnings, payments and content, and can log the posts they publish. A creator login can be set to read-only.

The design principle throughout is that nothing is counted unless it can be proven. A referral is credited only when RevenueCat delivers a verified event that can be tied to a creator's offer. Downloads are explicitly labeled "Not connected" rather than estimated, because the backend never sees App Store installs.

## Kyle's role
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"role","technologies":["Next.js","Convex","Firebase Authentication","RevenueCat","Vercel","Vitest","Swift"]} -->
Kyle-Anthony Hay built the SelahNote Creator Dashboard entirely on his own, as part of SelahNote, his own product. All commits to the dashboard app, its design docs and the related Convex backend functions are his. He owned it end to end, from the business rules of the referral program through to the deployed system:

- **Product and program design:** how a referral is defined, when a reward is earned, what counts as proof, and what the dashboard deliberately refuses to do. Examples are moving money, granting app access and counting downloads.
- **Backend:** the RevenueCat webhook endpoint, event ingestion and attribution, the reward ledger, the payout and adjustment model, role-based membership, the audit log, the New York reporting calendar and content syncing. All of it is built on Convex.
- **Frontend:** the Next.js dashboard, including the overview with charts and date ranges, creator pages, the payouts workflow, event reconciliation, the content log, member management, profiles and settings. There is also a creator-scoped view that staff can preview.
- **iOS integration:** changes in the SelahNote Swift app so offer-code redemptions sync after Apple's redemption sheet closes, plus free-trial status in Settings. He also removed an older in-app admin screen in favor of the standalone web app.
- **Operations:** Firebase project configuration, Convex development and production deployments, RevenueCat webhook setup, Vercel deployment with a custom domain, and the migration from an environment-variable allowlist to database-backed membership.
- **Documentation and verification:** architecture, data dictionary, setup and verification documents that separate what was tested, what was deployed and what still needs a real end-to-end test.

This is forward-deployed-style work. Kyle took a messy real business process (paying marketing partners), turned it into precise, testable rules, and shipped a working internal tool used by real staff and creators.

## Features
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"features","technologies":["Next.js","Convex","Apify","Firebase Authentication"]} -->
The SelahNote Creator Dashboard's staff-facing features include:

- **Overview:** live tiles and charts for verified trials, paid conversions, active subscriptions, cancellations, expirations, refunds, earned rewards, recorded payments and unpaid balance. Ranges include today, this week, this month, all time or a custom date range, all in New York time.
- **Creators and creator detail:** create and edit creators and their public codes, pause or retire a creator, see the status of external offer setup (no mapping, unverified or verified), and view each creator's performance and outstanding balance.
- **Monthly payouts:** preview what a creator is owed, including carryover from earlier months, then record a payment of any amount up to the balance. Recording requires an explicit confirmation checkbox. Batch history and signed adjustments for corrections are included.
- **Events and reconciliation:** a paginated list of RevenueCat events with processing status, health counts, retry for failed events, re-running pending attribution, and manual attribution with a required reason.
- **UGC content log:** paste a TikTok, Instagram or Facebook post link, and the backend pulls the caption, post date, views, likes and comments.
- **Members:** owners grant roles, make creator logins read-only, and revoke or restore access. A revoked user's open browser drops to "Access revoked" without a reload.
- **Profile and settings:** display name, profile picture, sign-in email, a year-long activity grid with streaks, a Sandbox/Production data switch, and a "preview as creator" mode.

Creators get a scoped version of the same app. They see their own trial counts, earnings, payments and content, and they can log their own posts. Creators always see production data, while staff can also inspect sandbox test data. The header has a Live / Syncing / Reconnecting indicator so users know whether the numbers are current.

## Architecture
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"architecture","technologies":["Next.js","React","Convex","Firebase Authentication","RevenueCat","Apify","Vercel","WebSockets"]} -->
The SelahNote Creator Dashboard is a thin Next.js client on top of a Convex backend that it shares with the SelahNote iOS app. The web app hosts only UI. Data, business logic, scheduled jobs and webhook ingestion all live in Convex.

**Client to backend:** the browser signs in with the Firebase Authentication SDK using email and password. Convex's authenticated React client requests a fresh Firebase ID token whenever it needs one, including forced refreshes and reconnects. Every page reads through Convex queries subscribed over a WebSocket, so when a webhook lands or another admin records a payout, every open browser updates without polling.

**Authorization:** every dashboard query and mutation first calls a shared admin check. It verifies the token's issuer and subject against an admin-membership table and the required role (owner, admin or viewer). A separate check covers creator logins, which are scoped to one creator. Because the membership row is read inside each query, revoking access re-runs live subscriptions and they fail immediately.

**Ingestion:** RevenueCat posts subscription lifecycle events to a Convex HTTP endpoint. The endpoint checks a shared secret with a timing-safe comparison, enforces a size limit, optionally checks the app id, stores the raw event, deduplicates by event id, and schedules processing. Processing resolves the customer's identity, matches the delivered offer to a creator, updates the subscription chain's lifecycle, and inserts at most one reward.

**Content sync:** a Convex action calls Apify's TikTok, Instagram and Facebook scrapers for exactly the logged post links. It runs on a six-hour cron, when a link is added, on demand, and when the Content page is opened if the numbers are older than 15 minutes.

**Storage:** Convex tables hold creators, codes, offer mappings, subscription events and chains, the reward ledger, payout batches and items, adjustments, content rows, members, profiles (with avatars in Convex file storage) and the audit log. The frontend deploys to Vercel. Public Convex and Firebase configuration is baked in at build time, and all secrets stay in Convex environment variables.

## Tech stack and why
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"tech-stack","technologies":["Next.js","React","TypeScript","Convex","Firebase Authentication","RevenueCat","Apify","Vercel","Vitest","convex-test","SVG"]} -->
The SelahNote Creator Dashboard's stack follows from one constraint: it had to sit on the same backend and identity system as the existing SelahNote iOS app.

- **Convex (backend, database, real-time, cron, HTTP):** SelahNote already used Convex, so the dashboard reuses the existing referral ingestion and reward ledger instead of copying them. Convex queries are reactive over WebSockets, which gives live updates without a separate pub/sub layer. Its mutations run as serializable transactions, which is exactly what payouts need. The alternative would have been a separate Postgres plus REST API. That would duplicate data and need polling or a custom real-time layer.
- **Next.js 16, React 19, TypeScript:** a standard, fast-to-build stack for an internal multi-page admin UI. The app compiles TypeScript declarations from the shared Convex folder so the frontend gets end-to-end typed API calls without type-checking the whole iOS backend.
- **Firebase Authentication:** the SelahNote app already identifies users with Firebase, and Convex trusts Firebase ID tokens. The dashboard uses a separate web app registration, email and password only, with no signup form. Logging in proves identity, while a database row decides access. Creator logins are created server-side through Firebase's Identity Toolkit using a service account, so creators never need a SelahNote customer account.
- **RevenueCat webhooks:** RevenueCat is already SelahNote's subscription and entitlement authority. The dashboard listens to it but never changes billing or entitlements.
- **Apify:** pulls public post metrics by link, without asking creators for platform credentials. Kyle wrote a researched plan for moving Instagram to Meta's official API.
- **Plain SVG charts:** sparklines and a line chart with a crosshair tooltip, written by hand rather than with a chart library to keep the bundle small.
- **Vercel:** hosts the frontend. A custom deploy script uploads a clean copy because the account has no Git connection.
- **Vitest with convex-test:** runs backend functions against an in-memory Convex for realistic tests.

## Signature system: verified referral attribution pipeline
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"referral-attribution","technologies":["RevenueCat","Convex","App Store offer codes","Webhooks","TypeScript"]} -->
The core of the SelahNote Creator Dashboard is a referral attribution pipeline that credits a creator only when there is proof. Apple never tells the app which code a customer typed. RevenueCat does deliver the offer's reference name in each event. Kyle designed a naming convention around this: every creator offer in App Store Connect starts with the creator's public code followed by an underscore, such as CODE_PRO_2W. The first time a redemption of such an offer arrives, the backend creates the offer-to-creator mapping itself, marks it verified by that event, writes an audit entry and attributes the trial. No one enters mappings by hand. A code that is a prefix of another code is still safe because the underscore ends the code segment.

Processing keys each subscription "chain" by store, environment and original transaction id. It resolves the customer from non-anonymous ids and aliases, and it locks in the acquisition creator at the first purchase. If that first purchase was a free trial and the identity is resolved, exactly one reward is inserted. Duplicate rewards are blocked at three levels: the webhook event id, a per-customer qualification key, and the store transaction key. A customer who already earned a reward for one creator cannot earn another by redeeming a second code.

Anything the pipeline cannot prove stays pending with an explicit reason: unknown offer, anonymous or conflicting identity, paused creator, or missing creator. Pending chains are re-run automatically when a mapping appears, or from a button in the dashboard. Later events such as renewals, conversions, cancellations, expirations, refunds and transfers update the chain's outcome for reporting. They never add or remove a reward, so payouts stay stable. On the iOS side, Kyle made the app pull customer info after Apple's redemption sheet closes, because the paywall can dismiss before RevenueCat sees the transaction.

## Signature system: idempotent, transactional payouts
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"payouts","technologies":["Convex","TypeScript","Idempotency keys","Serializable transactions"]} -->
The SelahNote Creator Dashboard records creator payments through one Convex mutation, which runs as one serializable transaction. It does not move money. Staff pay creators outside the platform and the dashboard records what was paid. The payout flow is built so that a double click, a network retry or two admins acting at once can never pay the same reward twice.

The payout page generates an idempotency key for each reviewed preview. When a payment is recorded, the mutation runs these steps in order:
1. It looks up the key, and a repeat request returns the original batch.
2. It re-reads every selected reward and checks that the reward belongs to this creator and environment, is in USD, is still owed, is not already in a batch, and started before the payout month ended.
3. It requires the recomputed balance to equal the balance the admin saw. It then accepts any amount up to that balance and refuses anything more.
4. It allocates the payment with a pure function. Negative adjustments settle first, then whole rewards and positive adjustments from oldest to newest while they fit. Any remainder becomes an open credit that the next payment settles first, so the balance always drops by exactly the amount paid.
5. It writes the batch, a snapshot item for each covered reward, the reward status changes, the settled adjustments and one audit row.

A second admin finalizing the same rewards hits a "reward already paid" error. Paid rewards and finalized batches are never rewritten. Corrections are signed adjustment rows with a reason, settled by the next batch. Batches are capped at 500 rewards. Sandbox batches are flagged as simulated and labeled everywhere. All money is stored as integer cents, and every period uses a hand-written America/New_York calendar. That calendar implements US daylight-saving rules without Intl, so the backend and the tests agree exactly at month and DST boundaries.

## Signature system: role-based access with live revocation
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"access-control","technologies":["Firebase Authentication","Convex","RBAC","JWT"]} -->
The SelahNote Creator Dashboard separates who a user is from what the user may do. Firebase Authentication proves identity. Access comes only from an active membership row keyed by the trusted Firebase issuer and the user's uid. An email address is never a key, and a company email domain grants nothing by itself. Staff roles are owner, admin and viewer. Creator logins are a separate kind of member with a creator role (can log posts) or a viewer role (read-only).

Every dashboard function starts with a shared role check. It rejects anonymous callers, ordinary SelahNote customers, tokens from other issuers, users with unverified emails, and members whose role is too low. Because Convex queries re-run when the data they read changes, revoking a membership instantly breaks that user's live subscriptions, and their open browser shows "Access revoked" without a reload. Owners cannot demote themselves. The first membership is created only through a CLI-run internal mutation after the uid has been checked in the Firebase console, so no browser request can grant itself access.

Creator scoping happens on the server. A creator's requests always resolve to their own creator record and production data. Staff can preview any creator's view, and in that mode they can still log content on the creator's behalf. Kyle also moved SelahNote's older HTTP admin routes from an environment-variable uid allowlist to the same membership table. He followed a fail-closed order: deploy, bootstrap owners, then remove the old variable.

Every dashboard write records the verified actor's subject and email in an audit log, along with before and after details. This covers creator and code edits, offer mappings, attribution changes, reward voids, event retries, payouts, adjustments, content changes and membership changes. Customer ids are masked in the UI, and raw webhook payloads are never shown.

## Engineering decisions and tradeoffs
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"decisions-tradeoffs","technologies":["Convex","RevenueCat","Firebase Authentication","Apify","Next.js"]} -->
Kyle made several deliberate tradeoffs when building the SelahNote Creator Dashboard:

- **A standalone web app instead of an in-app admin screen.** An earlier native admin view in the iOS app was removed. Admins should not need to install SelahNote or hold a customer account, and admin code should not ship in a consumer app.
- **Reuse rather than duplicate.** The dashboard extends the existing referral tables and ingestion with new indexes and tables. It does not create a competing ledger, so the iOS app, the HTTP routes and the dashboard all agree.
- **Record money, don't move it.** Automated payouts were left out on purpose. Recording an external payment keeps the system simple and avoids taking on payment-processing risk for an early-stage program.
- **Proof over convenience.** Unverifiable referrals stay pending instead of being guessed. Downloads are shown as "Not connected" rather than estimated from trials or clicks.
- **Rewards are fixed at acquisition.** Later lifecycle events change reporting but not money owed, which keeps payouts predictable. Voids are manual, need a reason and are blocked once a reward is in a batch.
- **Naming convention over manual mapping.** Deriving the creator from the offer reference name removed a manual, error-prone step. The cost is a rule that has to be followed in App Store Connect.
- **Pay any amount up to the balance.** Partial payments are supported with carried credit, which makes the allocation logic more complex but fits how creators are actually paid.
- **Per-creator figures are computed on read.** Per-creator totals scan that creator's rows at query time. This is simple and correct at current volume, and the data dictionary notes that precomputed monthly rollups should replace it past roughly ten thousand rows per creator.
- **Scraping as a stopgap.** Apify gives link-based metrics with no creator setup. The tradeoff is reliance on public data, so Kyle documented a plan to move Instagram to Meta's official API with creator consent.

## Challenges
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"challenges","technologies":["RevenueCat","App Store offer codes","Convex","Apify","Firebase Authentication","Vercel"]} -->
The SelahNote Creator Dashboard had to handle several real-world problems:

- **Apple hides the typed code.** Redemption happens in Apple's sheet, and only the offer reference name reaches RevenueCat. Kyle built attribution on reference names and had the naming convention create mappings automatically.
- **Redemptions outrunning RevenueCat.** On iOS the paywall could close before RevenueCat registered the offer-code transaction. The app now pulls redemption results after Apple's sheet closes.
- **Identity edge cases.** Purchases can start anonymously, accounts can be deleted, and subscriptions can transfer between accounts. The pipeline resolves identity from aliases, keeps conflicting identities pending, flags transfers for review, and redacts raw payloads on account deletion without changing balances.
- **Concurrency and retries around money.** Double clicks, retries and two admins on the same rewards are handled with idempotency keys, re-reads inside one transaction, and an expected-total check.
- **Time zones.** Reports use New York calendar periods, so 11:30pm on the last day of a month must count toward that month. The calendar was written by hand and tested across the 23-hour and 25-hour DST days.
- **Unreliable scraped data.** Scraper results vary by platform. Facebook links have no stable id and need one run per post. Missing or negative counts are treated as unavailable rather than zero, and per-post sync errors appear in the UI. A 15-minute cooldown avoids paying for a scrape on every page visit.
- **Environment drift.** When the live site switched to production Convex, creator logins that existed only in development had to be recreated in production. Kyle documented this so later setup is repeated on both.
- **Deployment friction.** Vercel blocked CLI uploads with commit metadata it couldn't match, so the deploy script uploads a clean copy with a pinned team scope.

[NEEDS KYLE: hardest part in your words]

## Quality and operations
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"quality-operations","technologies":["Vitest","convex-test","TypeScript","Firebase Authentication","Convex","Vercel","RevenueCat"]} -->
The SelahNote Creator Dashboard has backend tests written with Vitest and convex-test, which run Convex functions against an in-memory database. The suites cover the dashboard API, the original referral rules, profiles and activity, and the content-sync parsers.

The tests check:
- DST offsets and month, week and day ranges.
- Denial of anonymous users, customers, foreign token issuers, unverified emails and revoked members.
- Sandbox kept separate from production.
- Offer-mapping verification against matching evidence.
- Event retry.
- Payout carryover, idempotent replays, refusal of concurrent double payment, partial payments with credit, frozen paid rewards, and cross-creator or cross-environment rejection.
- Creator login scoping and read-only access.
- The content-refresh cooldown.
- Original referral scenarios such as replay, conversion, cancellation, restore, transfer, deletion, sandbox separation and webhook auth.

The dashboard's typecheck and production build pass. No CI pipeline is set up for the dashboard itself.

Security measures in the code:
- Timing-safe comparison of the webhook secret, a payload size limit, and an optional app-id check.
- No secrets in the web app. Only public Firebase and Convex configuration is shipped, and a build-bundle scan confirmed no RevenueCat or other secret strings.
- Masked customer ids and hidden raw payloads.
- Creator passwords pass through the server once and are never stored.
- Content links are limited to http and https.
- Signing out reloads the page to discard cached data.

Operationally, the frontend runs on Vercel at a custom subdomain with TLS, and the old Vercel hostname permanently redirects. Development and production Convex deployments each have their own RevenueCat webhook and secret, and test deliveries returned HTTP 200 on both. The verification document separates proven items from items still pending, such as a full real-purchase round trip.

## Outcomes and business value
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"outcomes","technologies":["RevenueCat","Convex"]} -->
The SelahNote Creator Dashboard gives SelahNote, an app with over 400 users, the operational backbone for a creator and affiliate marketing program. Paying for creator-driven growth is a recurring cost. This tool lets the business tie that cost to verified results: trials attributed from RevenueCat-verified events, followed through conversions, cancellations and refunds. Payment decisions rest on evidence instead of screenshots or self-reported numbers.

The business value comes from a few concrete properties:
- **Trust with creators:** each creator can sign in and see the same trial counts, earnings and payment history that staff see, which reduces disputes.
- **No double payments:** idempotent, transactional payout recording and a frozen payment history protect the business from paying twice and keep a complete record of what was paid and why.
- **Accountability:** a full audit trail with verified actor identity covers every change to creators, attribution, rewards, payouts and access.
- **Less manual work:** offer mappings are created automatically from the naming convention, post metrics refresh on their own, and pending referrals can be re-run with one click.
- **Safe access control:** staff and creator access can be granted or revoked instantly, with no shared passwords and no admin code in the consumer app.

It also shows that Kyle can take an ambiguous business process (paying marketing partners), turn it into precise rules, and ship a working internal system used by real people.

## Status and next steps
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"status","technologies":["Vercel","Convex","RevenueCat","Firebase Authentication","Meta Instagram API","Apify"]} -->
As of late September 2026, the SelahNote Creator Dashboard is deployed and internal. The frontend runs on Vercel at a custom SelahNote subdomain, with production Convex behind it. Staff owner accounts are set up on both the development and production deployments, and creator logins have been provisioned. The backend, the payout system and creator access controls are implemented and tested. The most recent work added custom date ranges and a layout refresh.

The project's own verification notes list what is still open:
- A real sandbox offer-code redemption for each creator, to confirm automatic mapping and reward creation end to end with live RevenueCat payloads.
- Checking real payload shapes for duplicate delivery, out-of-order events, cancellation, expiry, refund, conversion and restore. All of these are covered with fixtures, but not yet against live provider data.
- The first real production payout batch.
- Email verification for the company admin account.
- Choosing a download or first-open data source (for example App Store Connect analytics) before any download counts are shown.

Planned next steps:
- **Instagram metrics:** Kyle researched and wrote a plan to move from scraping to Meta's Instagram API with Instagram Login. It covers a creator "Connect Instagram" flow, encrypted server-side token storage, minimal permissions, rate-limit budgeting and Meta app review. It is planning only and not yet built.
- **Scaling reports:** replace per-creator scans with monthly rollups if volume grows.

Features left out on purpose for now: automated money transfers, a public referral landing route, QR tracking, and an in-app code claim screen.

## Skills demonstrated
<!-- meta: {"type":"project","project":"SelahNote Creator Dashboard","category":"skills","technologies":["Next.js","React","TypeScript","Convex","Firebase Authentication","RevenueCat","Apify","Vercel","Vitest","convex-test","Swift","SVG","Webhooks"]} -->
The SelahNote Creator Dashboard shows the following skills, grouped by area:

**Web and full-stack engineering:**
- Next.js 16, React 19 and TypeScript.
- Real-time UI built on WebSocket subscriptions (reactive queries, live updates).
- An internal admin dashboard and back-office tool with data tables, pagination, date-range pickers and custom SVG data visualization (sparklines, line charts, tooltips).
- End-to-end type safety from backend to frontend.

**Backend and data:**
- Convex queries, mutations, actions, cron jobs, HTTP endpoints and file storage.
- Webhook ingestion and event processing.
- Idempotency, deduplication and serializable transactions (ACID).
- Financial ledger design: integer cents, partial payments, credits and adjustments.
- Reconciliation and audit logging.
- Time-zone-correct reporting across daylight saving time.
- Schema design with environment-scoped indexes.

**Auth and security:**
- Authentication versus authorization, and role-based access control (RBAC).
- Firebase Auth with JWT ID tokens and trusted-issuer checks.
- Server-side tenant scoping (multi-tenant style creator isolation).
- Live revocation.
- Secret handling and timing-safe comparison.
- Least privilege and fail-closed migrations.
- PII masking and data redaction.

**Payments, subscriptions and growth:**
- RevenueCat, App Store offer codes and subscription lifecycle (trials, conversions, churn, refunds).
- Referral attribution, affiliate and influencer marketing, and UGC creator program operations.
- Payout tooling.

**Integrations:**
- Apify scrapers for TikTok, Instagram and Facebook metrics.
- The Firebase Identity Toolkit admin API with service-account JWT signing.
- Researched integration planning for Meta's Instagram Graph API with OAuth.

**iOS:** Swift changes to the SelahNote app's paywall and offer-code redemption syncing.

**Quality and DevOps:**
- Vitest and convex-test integration tests.
- Vercel deployment with a custom domain.
- Separate development and production environments.
- Thorough technical documentation (architecture, data dictionary, runbooks).

**Forward-deployed relevance:** Kyle turned a real operator problem into precise business rules, built and deployed the full system solo, integrated several third-party platforms, and supported real stakeholders (staff and creators) in production.
