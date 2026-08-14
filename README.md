# Living Word Community

*Grow in faith. Build community. Stay connected.*

A private digital community platform for a local church — groups, discussions, sermons, prayer, events, messaging, and an administrative back office, built as an original church-focused platform (not a clone of any existing product).

---

## Table of contents

1. [Tech stack & decisions](#tech-stack--decisions)
2. [Architecture](#architecture)
3. [Folder structure](#folder-structure)
4. [Local setup](#local-setup)
5. [Sample accounts](#sample-accounts)
6. [Permission matrix](#permission-matrix)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Features completed](#features-completed)
10. [Intentionally deferred](#intentionally-deferred)
11. [Security & privacy notes](#security--privacy-notes)

---

## Tech stack & decisions

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) | Server Components let permission-aware queries run close to the data; Server Actions remove the need for a separate API layer for most mutations. |
| Styling / UI | Tailwind CSS v4 + shadcn/ui (Base UI primitives) | Accessible, unstyled primitives (focus management, ARIA) with full control over visual design — avoids "generic SaaS" look. |
| Database | PostgreSQL + Prisma ORM (driver adapter: `@prisma/adapter-pg`) | Relational integrity for a permission/privacy-heavy domain model; Prisma gives typed queries end to end. |
| Auth | Auth.js (NextAuth) v5 | Self-hosted, full control over the approval-gated registration flow and a custom RBAC model living in our own tables — Clerk's user model would fight that. Credentials (email+password), magic link (Resend), and Google OAuth are wired up; Apple is a one-provider addition away (architecture already supports it). |
| Validation | Zod v4 | Shared schemas between client forms and server actions. |
| Forms | React Hook Form | Pairs with Zod resolvers; used throughout onboarding, prayer, profile, and admin forms. |
| Uploads | UploadThing (planned integration point) | Avatar/photo upload currently uses a small built-in avatar picker (no file storage secrets required for local dev); the schema and settings are ready for UploadThing once a token is supplied. |
| Video | Provider-abstracted (`VideoPlayer` component + `provider`/`providerRef` fields) | Supports YouTube, Vimeo, Mux, Cloudflare Stream, and direct HLS without schema changes — swapping providers is a data change, not a code change. |
| Email | Resend | Transactional templates for welcome, magic link, approval, group requests, event reminders, announcements, prayer updates. Falls back to console logging in dev when `RESEND_API_KEY` is unset. |
| Realtime | Not wired in this pass (see [Deferred](#intentionally-deferred)) | Messaging and notifications work today via server actions + `router.refresh()`; a Pusher/Ably layer is a drop-in addition later. |
| Testing | Vitest (unit) + Playwright (e2e) | Fast unit coverage for pure logic (validation, RBAC, formatting); Playwright drives real browser flows against the seeded dev database. |

### Why Prisma's driver-adapter pattern

This project pins **Prisma 7**, which removed embedding the database URL in `schema.prisma`. The connection string lives in `prisma.config.ts` (used by the CLI/migrations) and the runtime `PrismaClient` is constructed with a `@prisma/adapter-pg` driver adapter in `src/lib/prisma.ts`. If you're used to older Prisma versions, this is the main thing that looks different.

### Local Postgres without Docker

No Docker or system Postgres install is required. `npm run db:dev` boots a real, disk-persisted Postgres 17 instance (via the `embedded-postgres` package) on `localhost:5433`, scoped entirely to this project's `.pgdata/` folder. This was a deliberate choice to keep setup to `npm install && npm run db:dev` — swap in a hosted Postgres (Supabase, Neon, RDS) for production by changing `DATABASE_URL`.

---

## Architecture

```
Guest / Member request
        │
        ▼
  src/proxy.ts  ──────────────►  redirects unauthenticated users to /sign-in
        │                         for protected path prefixes
        ▼
  Route group layout             (app)/layout.tsx        — full member shell, requires ACTIVE + onboarded
                                  (admin)/admin/layout.tsx — requires ADMINISTRATOR or PASTOR_STAFF
                                  (public)/layout.tsx      — marketing chrome for guests
                                  watch/, events/ layouts  — dual-mode: guest OR member chrome, same URL
        │
        ▼
  Server Component page          fetches only the data the signed-in user is authorized to see
        │                         (see "Permission-aware queries" below)
        ▼
  Server Action ("use server")   re-validates auth + Zod input on every mutation — never trusts the client
        │
        ▼
  Prisma → PostgreSQL
```

### Permission-aware queries, not permission-aware UI

Every sensitive read goes through a dedicated data-access helper rather than being filtered client-side:

- `src/server/data/prayer.ts#getVisiblePrayerWhere` — the **only** place that decides which `PrayerRequest` rows a user may see. `CONFIDENTIAL` and `PASTORAL_STAFF` requests are excluded from the `WHERE` clause entirely unless the caller holds `prayer.view_confidential` — they are never fetched and filtered client-side. Pastoral care notes (`PastoralCareNote`) are only ever queried when the viewer already holds `prayer.manage_pastoral_notes`.
- `src/server/data/watch.ts#visibleVideoWhere` — guests get `PUBLIC` only; members get `PUBLIC` + `MEMBERS_ONLY`; staff with `media.manage` see everything.
- `src/server/data/messaging.ts#canMessage` — enforces the minor-safety rule (see below) before a conversation can be created, and `getOrVerifyConversationAccess` gates every read of a conversation's messages.
- `src/lib/authz.ts` is the single source of truth for role/permission resolution (`getEffectivePermissions`) and is called directly inside every server action that performs a sensitive mutation — the client-side session token is used for *navigation UI* only (e.g. hiding the Admin link), never for authorization decisions.

This was verified with an actual Playwright test (`tests/e2e/prayer-security.spec.ts`) that creates a `CONFIDENTIAL` prayer request as one member and confirms a second, non-staff member gets a plain 404 when hitting the URL directly — not a permission error, which would confirm the record's existence.

### Role-based access control

Two layers, matching how the spec's roles actually behave:

1. **Global permission keys** (`src/lib/rbac.ts`) — platform-wide capabilities like `content.moderate`, `prayer.view_confidential`, `events.manage_all`. Seeded onto roles via `RolePermission`, and individually overridable per user via `UserPermission` (admins can grant/revoke a single permission without inventing a new role — this satisfies "administrators should be able to create custom permission combinations").
2. **Resource-scoped checks** (`src/lib/authz.ts#isGroupLeader`, `#isSpaceLeaderOrAdmin`) — a Group Leader's powers are intentionally scoped to *their assigned* group(s), checked against `GroupMember.role`, not a blanket "can moderate everything" flag.

### Minor safety

`Profile.isMinor` is an internal-only flag (never rendered, never exposed via a public "age" field). `canMessage()` blocks a new adult↔minor direct conversation unless the adult holds a leadership/staff permission, satisfying the spec's "disable direct adult-to-minor messaging unless a leader" requirement while keeping pastoral contact possible.

---

## Folder structure

```
community/
├── prisma/
│   ├── schema.prisma        # full data model (see below)
│   └── seed.ts               # realistic sample content — no lorem ipsum
├── scripts/
│   └── dev-db.mjs            # boots the local embedded Postgres instance
├── src/
│   ├── app/
│   │   ├── (public)/         # landing, about — guest-only chrome
│   │   ├── (app)/            # home, community, groups, prayer, messages, … — full member shell
│   │   ├── (admin)/admin/    # admin dashboard, gated on role
│   │   ├── watch/, events/   # dual-mode: same URL serves guests (public content) and members (full library)
│   │   ├── onboarding/       # top-level so it isn't nested inside the "must be onboarded" gate
│   │   └── api/auth/         # NextAuth route handler
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives
│   │   ├── layout/             # app shell: sidebar, bottom nav, topbar, conditional shell
│   │   └── <feature>/          # posts/, prayer/, groups/, events/, watch/, admin/, messaging/, settings/
│   ├── server/
│   │   ├── actions/            # "use server" mutations — every one re-checks auth server-side
│   │   └── data/                # permission-aware read helpers (feed, prayer, watch, messaging)
│   └── lib/                     # auth.ts, authz.ts, rbac.ts, prisma.ts, validations/, email/
└── tests/
    └── e2e/                    # Playwright specs
```

---

## Local setup

### Prerequisites

- Node.js 20.9+ and npm
- No Docker or system Postgres required (see above)

### Steps

```bash
cd community
npm install

# Copy environment defaults (already pre-filled for local dev)
cp .env.example .env   # or edit the provided .env directly

# Start the local database (leave this running in its own terminal)
npm run db:dev

# In a second terminal: apply the schema and seed realistic content
npm run db:generate
npm run db:migrate
npm run db:seed

# Start the app
npm run dev
```

Visit `http://localhost:3000`. Sign in with any [sample account](#sample-accounts) below.

### Environment variables

See `.env.example` for the full list. In local dev, everything works with the defaults except:

- **Email** — without `RESEND_API_KEY`, outgoing emails (magic links, approvals, reminders) are logged to the server console instead of actually sent. This is intentional so the full flow is testable without an email provider.
- **Google sign-in** — the button only appears if `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are set.

---

## Sample accounts

Every seeded user shares the same password: **`LivingWord2026!`**

| Role | Email | Notes |
|---|---|---|
| Administrator | `admin@livingword.church` | Full platform access, including Settings, Roles, Audit Logs |
| Pastor / Staff | `pastor@livingword.church` | Church-wide content, prayer, events, announcements — no branding/roles access |
| Ministry Leader | `worship.leader@livingword.church` | Leads the Worship ministry space |
| Group Leader | `group.leader@livingword.church` | Leads "Men of Faith" |
| Member | `member@livingword.church` | Regular member, joined a couple of groups |
| Member (pending) | `pending@livingword.church` | Demonstrates the approval-required registration flow — signs in but is held at `/pending-approval` until an admin approves them |

**To try the admin approval flow locally:** sign in as `admin@livingword.church` → Admin Dashboard → Users → search "Jordan" → Approve.

---

## Permission matrix

| Capability | Guest | Member | Group Leader | Ministry Leader | Pastor/Staff | Administrator |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| View public landing/about/watch/events | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View community feed, join open groups | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Request access to private groups | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create posts, comment, react, bookmark | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit prayer requests (all privacy levels) | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| RSVP to events, message members | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage *their assigned* group (approve members, pin, mute, moderate) | — | — | ✅ (scoped) | — | ✅ | ✅ |
| Manage *their assigned* ministry space | — | — | — | ✅ (scoped) | ✅ | ✅ |
| View/manage prayer team queue | — | — | — | — | ✅ | ✅ |
| View confidential prayer requests & pastoral notes | — | — | — | — | ✅ | ✅ |
| Publish church-wide announcements | — | — | — | — | ✅ | ✅ |
| Manage all groups/spaces, feature content, moderate reports | — | — | — | — | ✅ | ✅ |
| Manage media library (videos/series/speakers) | — | — | — | — | ✅ | ✅ |
| Manage all events, export attendees | — | — | — | — | ✅ | ✅ |
| View analytics | — | — | — | — | ✅ | ✅ |
| Assign roles & custom permission overrides | — | — | — | — | — | ✅ |
| Branding & application settings | — | — | — | — | — | ✅ |
| Audit logs | — | — | — | — | — | ✅ |

Full permission-key-to-role mapping lives in `src/lib/rbac.ts` (`ROLE_DEFAULT_PERMISSIONS`) and is also viewable live at **Admin → Roles & Permissions**.

---

## Testing

```bash
# Unit tests (pure logic: RBAC defaults, Zod schemas, formatting helpers)
npm run test

# End-to-end tests (Playwright, drives a real Chromium browser against
# your locally running dev server + seeded database)
npm run dev            # in one terminal
npm run test:e2e       # in another
```

The e2e suite covers the workflows called out as critical in the spec: registration, account approval redirect, sign-in (valid/invalid/pending), joining an open group, requesting access to an approval-required group, creating/commenting/reacting to a post, submitting a confidential prayer request **and confirming a non-staff member cannot open it via direct URL**, RSVPing to an event, sending a message, reporting content, an admin redirect-guard for non-admins, and an admin changing a member's role.

Because Playwright exercises real server actions against the seeded database, running the suite will create a small amount of extra data (test posts, messages, prayer requests). Re-run `npm run db:seed` after a `prisma migrate reset` if you want pristine demo data again.

---

## Deployment

Designed for Vercel + a hosted Postgres provider (Neon, Supabase, RDS, etc.):

1. Provision a Postgres database and set `DATABASE_URL` (with `sslmode=require` if your provider needs it).
2. Set all secrets from `.env.example` in your hosting provider's environment variables — at minimum `AUTH_SECRET` (generate with `npx auth secret`), `DATABASE_URL`, and `NEXT_PUBLIC_APP_URL`.
3. Run `npx prisma migrate deploy` against the production database as part of your build/release step (not `migrate dev`).
4. Seed once, deliberately: `npm run db:seed` is meant for local/demo use. For a real launch, create the first Administrator account by hand (register normally, then flip their `status`/role directly in the database or via a one-off script) rather than running the sample-content seed.
5. `next build` / `next start` on Vercel's Node runtime (the app uses Server Actions and a Postgres driver adapter, both Node-only).
6. Configure Resend, and Google OAuth credentials if you want those sign-in paths in production.

---

## Features completed

- **Auth**: email/password, magic link, Google OAuth-ready, approval-gated registration (default per spec), session management, account suspension, account deletion request.
- **RBAC**: 6 roles, global permission keys + per-user overrides, resource-scoped group/ministry leadership.
- **Onboarding**: 8-step guided flow (welcome → guidelines → avatar → campus → interests → discover groups → notifications → finish), personalizes the home feed.
- **Home dashboard**: greeting, daily scripture, church announcement banner, next event, quick actions, continue watching, sortable feed (recommended/newest/most active), upcoming events, recommended groups.
- **Spaces & Groups**: flexible space model, open/approval-required/invite-only/hidden groups, custom membership questions, leader approve/deny queue, member directory per group, pinned posts, discussion feed.
- **Posts & discussions**: rich post types (standard/question/testimony/praise report/announcement), threaded comments with replies, five church-appropriate reactions, bookmarks, pin/lock/report/delete, view counts.
- **Prayer wall**: all six privacy levels including anonymous and fully confidential, "I Prayed" counter, updates, praise-report conversion, pastoral care notes strictly gated behind a dedicated permission, prayer-team assignment and status workflow.
- **Watch**: provider-abstracted player (YouTube wired in seed data; Vimeo/Mux/Cloudflare/HLS supported by the same component), featured/continue-watching/recently-added/series rails, per-user watch progress, series with ordered lessons and completion tracking, scripture references, transcripts.
- **Events**: RSVP (going/interested/not going), capacity + waitlist, ICS calendar export, CSV attendee export, duplicate/cancel, ministry-hosted events.
- **Announcements**: targeted (everyone/group/new members today; ministry/role/age-range have the data model but a lighter admin UI — see deferred), priority levels, pinning, in-app + optional email delivery.
- **Notifications**: in-app center with unread state, mark-all-read, per-category frequency preferences (immediate/daily/weekly/off), deep links.
- **Messaging**: 1:1 conversations, minor-safety-gated conversation creation, read state.
- **Profiles & directory**: per-field visibility controls, directory opt-out, searchable directory with campus/group filters, no sensitive fields ever rendered (address/phone/DOB/minor status).
- **Admin dashboard**: overview metrics, user search/approve/suspend/role-assign/CSV export, group/space archive, media library (video + series creation), prayer management queue, event creation/duplication/CSV export, announcement composer, report queue, roles/permissions viewer, privacy-conscious analytics, branding settings, audit log viewer.
- **Moderation**: report posts/comments/profiles/videos with reasons, admin resolve/dismiss, full audit trail.
- **Security**: every mutation re-authorizes server-side (never trusts the client), confidential prayer data has a dedicated, independently-tested authorization boundary, audit logging on sensitive actions (approvals, suspensions, role changes, pastoral notes, settings changes).
- **Design system**: burgundy/cream/charcoal/gold token-based theme, full light/dark mode, responsive sidebar (desktop) + bottom nav (mobile), accessible focus states throughout (Base UI primitives).
- **Realistic seed data**: every example from the spec (groups, video series, events, sample posts/testimonies/prayer requests) is seeded, not lorem ipsum.

## Intentionally deferred

Documented here rather than silently skipped, per the brief's request for an explicit list:

- **Realtime updates** (Pusher/Ably): messaging and notifications currently update via server actions + `router.refresh()`, not a live socket. The schema and action boundaries are already realtime-ready — swapping in a Pusher channel is additive, not a rewrite.
- **File uploads**: profile photos use a built-in avatar picker rather than arbitrary image upload; UploadThing integration is scaffolded in the tech-stack choice but not wired to a live token in this environment.
- **Rich text / poll post editor**: posts currently support plain formatted text (paragraphs preserved) rather than a full WYSIWYG editor with headings/bold/italic/lists/embeds, and poll-type posts aren't exposed in the composer UI yet (the `PollOption`/`PollVote` schema exists).
- **Video-page discussion threads**: videos support progress, bookmarking, transcripts, and related content, but a dedicated per-video comment thread (distinct from post comments) isn't built.
- **Full announcement targeting**: `EVERYONE`, `GROUP`, and `NEW_MEMBERS` targeting are wired end-to-end (including notification fan-out); `MINISTRY`, `ROLE`, `AGE_RANGE`, `EVENT_REGISTRANTS`, and `VOLUNTEERS` targeting exist in the schema but aren't yet selectable from the admin composer.
- **Global search**: the top-bar search box is present in the UI but not yet wired to a permission-aware search index across posts/members/videos/events.
- **Recurring events**: the `recurrenceRule` field exists on `Event`, but the admin UI creates single events only — no recurrence-expansion logic yet.
- **Event registration-question gating**: `EventRegistrationQuestion`/`Answer` models exist; the admin UI to author them and the member-facing form to answer them before RSVPing aren't built yet.
- **Certificates/quizzes for courses**: explicitly out of scope for v1 per the spec; the `VideoSeries` schema is structured so they can be added later without migration surgery.
- **Push notifications**: architecture is notification-category-based and ready for a push channel; no native push integration in this web-only build.
- **Rate limiting middleware**: Server Actions get Next.js's built-in origin-check CSRF protection; a dedicated rate-limiter (e.g. Upstash) isn't configured in this environment.

## Security & privacy notes

- **Authorization lives on the server, not in the UI.** Buttons are hidden for unauthorized users as a UX courtesy, but every server action independently re-checks the caller's permissions and every sensitive read goes through a permission-aware query helper (see [Architecture](#architecture)). This was validated with an automated test that attempts direct-URL access to a confidential prayer request as an unauthorized user.
- **Confidential prayer requests and pastoral care notes** are the most sensitive data in the schema. `PastoralCareNote` rows are only ever queried when the caller already holds `prayer.manage_pastoral_notes` — there is no code path that fetches them "just in case" and hides them client-side. Every access is behind `getVisiblePrayerWhere()`, the single function responsible for this decision.
- **Minor safety**: `Profile.isMinor` is never exposed through any public API, directory listing, or profile page. Direct messaging between an adult and a minor is blocked unless the adult holds a leadership permission (`canMessage()` in `src/server/data/messaging.ts`).
- **No sensitive fields are ever rendered**: full date of birth, home address, phone number, and pastoral notes are excluded from every user-facing query and component — not merely styled `display: none`.
- **Passwords** are hashed with bcrypt (cost factor 12) before storage; never logged or returned from any action.
- **Audit logging**: role changes, user suspensions/approvals, content removal, pastoral note additions, prayer status changes, and settings changes all write to `AuditLog` with the acting user, action, target, and metadata.
- **Input validation**: every server action validates its input with a Zod schema before touching the database; nothing trusts client-supplied types.
- **IDOR protection**: resource ownership/membership is re-verified inside the action (e.g. `assertCanSeeRequest`, `getOrVerifyConversationAccess`, `assertGroupLeader`) rather than assumed from the URL or a client-supplied ID.
