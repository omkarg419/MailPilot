# MailPilot

**AI-native Gmail and Google Calendar** — triage your inbox, draft replies, and manage your schedule with natural language.

Live demo: [mail2pilot.tech](https://mail2pilot.tech)

---

## Overview

MailPilot is a full-stack web app that wraps Gmail and Google Calendar in a modern UI, with an AI agent that can search mail, draft emails, check availability, and book meetings — all scoped to the signed-in user's account.

Sign in with Google, connect Gmail and Calendar once, then work from three workspaces:

| Workspace | What you can do |
|-----------|-----------------|
| **Mail** | Inbox, sent, drafts, trash, thread view, compose, archive, delete, restore |
| **Calendar** | Week view, create/edit/delete events, conflict detection |
| **Agent** | Natural-language assistant for inbox + calendar tasks |

Mail and Calendar are available to **all signed-in users**. The **Agent** is **invite-only** — an admin grants access by email from the Profile page.

---

## Features

### Mail
- Gmail labels: Inbox, Sent, Drafts, Trash
- Thread reading with HTML rendering
- Compose, reply, forward, save draft, send
- Archive and move to trash with optimistic UI
- Real-time inbox updates via Gmail Pub/Sub + Server-Sent Events (no manual refresh)

### Calendar
- Google Calendar week view
- Create, update, and delete events
- Conflict-aware scheduling before booking
- Real-time updates via Calendar push notifications

### AI Agent
- Streaming chat powered by **Claude** (Anthropic)
- **Draft email** cards — review and send from the UI
- **Calendar proposal** cards — book with one click after conflict check
- Multi-step flows (e.g. book a meeting, then auto-draft a confirmation email)
- Topic guardrails — agent stays on Gmail/Calendar tasks only
- **5 requests per 24 hours** per user (post-booking follow-up prompts are exempt)
- **Invite-only access** — admin-managed allowlist in the database

### Security & access
- Google OAuth via NextAuth
- Gmail/Calendar tokens encrypted via **Corsair** (per-tenant isolation)
- Agent API enforces allowlist + rate limits server-side

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | TypeScript |
| API | [tRPC](https://trpc.io) + Route Handlers |
| Auth | [NextAuth.js](https://next-auth.js.org) (Google provider) |
| Database | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team) |
| Integrations | [Corsair](https://corsair.dev) (Gmail + Google Calendar plugins) |
| AI | [Anthropic Claude](https://anthropic.com) |
| Styling | Tailwind CSS |
| Deploy | [Railway](https://railway.app) |

---

## Getting started (local)

### Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL database
- Google Cloud project with OAuth credentials
- Anthropic API key

### 1. Clone and install

```bash
git clone <repo-url>
cd MailPilot
pnpm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

```env
# Auth
AUTH_SECRET=                    # npx auth secret
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/MailPilot

# Corsair (Gmail + Calendar integration)
CORSAIR_KEK=                    # openssl rand -hex 32
APP_URL=http://localhost:3000

# Agent
ANTHROPIC_API_KEY=
AGENT_ADMIN_EMAIL=you@gmail.com   # optional locally; required in production

# Realtime (optional for local dev)
GMAIL_PUBSUB_TOPIC=
```

For calendar/Gmail push webhooks locally, use an HTTPS tunnel (e.g. ngrok) and set `APP_URL` to the tunnel URL.

### 3. Database

```bash
pnpm db:migrate
```

Open Drizzle Studio (optional):

```bash
pnpm db:studio
```

### 4. Corsair setup

After migrations, connect Gmail and Calendar integrations to your local DB:

```bash
npx corsair setup --gmail --googlecalendar
```

Use the same `CORSAIR_KEK` as in `.env`.

### 5. Google OAuth redirect URIs

Add these in Google Cloud Console → APIs & Services → Credentials:

```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/corsair/callback
```

Authorized JavaScript origin:

```
http://localhost:3000
```

### 6. Run

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Agent access (invite-only)

1. Set `AGENT_ADMIN_EMAIL` to the Google account that should manage access.
2. Sign in with that account → **Profile** → **Agent access**.
3. Grant access by email (users can be added before or after they sign up).
4. Granted users can use the Agent; everyone else sees an invite-only message.

The admin email always has agent access and can manage the allowlist.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm check` | Lint + typecheck |
| `pnpm db:migrate` | Apply Drizzle migrations |
| `pnpm db:generate` | Generate migration from schema changes |
| `pnpm db:studio` | Open Drizzle Studio |

---

## Deploying to Railway

### Environment variables

Set on the Railway service (in addition to the vars above):

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
AUTH_URL=https://your-app.up.railway.app
AUTH_TRUST_HOST=true
APP_URL=https://your-app.up.railway.app
AGENT_ADMIN_EMAIL=admin@gmail.com
```

`APP_URL` and `AUTH_URL` must include `https://`.

### Google OAuth (production)

```
https://your-app.up.railway.app/api/auth/callback/google
https://your-app.up.railway.app/api/corsair/callback
```

### Migrate production database

From your machine, using Railway Postgres **public** connection URL:

```bash
DATABASE_URL="postgresql://..." pnpm db:migrate
```

### Corsair on production

Run Corsair setup against the production database with the same `CORSAIR_KEK` as Railway.

---

## Project structure

```
src/
├── app/              # Next.js routes (mail, calendar, agent, api)
├── components/       # UI (mail, calendar, agent, landing, profile)
├── hooks/            # Realtime mail hooks
├── lib/              # Client utilities, mail cache
├── server/
│   ├── agent/        # AI agent, guardrails, rate limits, allowlist
│   ├── api/          # tRPC routers
│   ├── auth/         # NextAuth config
│   ├── db/           # Drizzle schema
│   ├── gmail/        # Gmail helpers, watch
│   ├── calendar/     # Calendar helpers, conflicts
│   └── realtime/     # SSE mail events
drizzle/              # SQL migrations
```

---

## License

Private — WebDev Cohort 2026 Hackathon project.
