# PING Platform MVP — Master Implementation Plan (20 Days, 5 Devs)

## Context

PING is an AI-native team communication platform positioned as "Company Brain Infrastructure" for 50-200 person product teams. It replaces Slack/Teams with:
1. **Copilot Inbox with Eisenhower Matrix** — AI-ranked cards (Urgent/Important matrix) instead of chronological chat noise
2. **Integration-First Native Objects** — GitHub PRs, Linear tickets as actionable cards
3. **Temporal Knowledge Graph** — @KnowledgeBot answers company questions with cited sources AND proactively fact-checks ongoing discussions
4. **Proactive Workspace Agent** — unified heartbeat-driven system with 5 specialized sub-agents that detect and resolve issues before you ask
5. **Cross-Team Context Syncing** — AI proactively surfaces relevant context from other channels/teams

**Key docs:** `system_architecture.md`, `pitch_strategy.md`, `product_vision.md`, `product_mission.md`

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| Backend | Convex (serverless BaaS — real-time sync, vector search, CRON) |
| Auth | WorkOS AuthKit (Google OAuth for MVP, SAML deferred) |
| Knowledge Graph | Graphiti + Neo4j (temporal semantic graph-RAG) |
| AI | Vercel AI SDK + OpenAI (primary) / Claude (fallback) |
| Monorepo | Turborepo + pnpm workspaces |

---

## Team Structure

| Role | Scope | Plan File |
|------|-------|-----------|
| **Dev 1** | Frontend — Layout, Copilot Inbox UI, core messaging UI, proactive card UI | `01-dev1-frontend-layout.md` |
| **Dev 2** | Frontend — Auth UI, integration cards, polish, onboarding, proactive card styling | `02-dev2-frontend-auth-integrations.md` |
| **Dev 3** | Backend — Convex schema, auth, APIs, webhooks, seed data, proactive alert CRUD | `03-dev3-backend.md` |
| **Dev 4** | Knowledge Engine — Graphiti service, ingestion pipeline, graph queries | `04-dev4-knowledge-engine.md` |
| **Dev 5** | AI — Summarization, @KnowledgeBot, Eisenhower ranking, Workspace Agent heartbeat, proactive fact-checking, cross-team syncing, 5 sub-agents, prompt engineering | `05-dev5-ai-agents.md` |

---

## Monorepo Structure

```
platform/
├── turbo.json
├── package.json                    # pnpm workspaces root
├── pnpm-workspace.yaml
├── .env.example
├── apps/
│   └── web/                        # Next.js 14 App Router
│       ├── middleware.ts            # WorkOS auth route protection
│       ├── app/
│       │   ├── layout.tsx           # Root: ConvexProviderWithAuth
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── callback/page.tsx
│       │   └── (dashboard)/
│       │       ├── layout.tsx       # Sidebar + TopBar shell
│       │       ├── inbox/page.tsx   # Copilot Inbox
│       │       ├── channel/[channelId]/page.tsx
│       │       ├── dm/[dmId]/page.tsx          # Direct messages (reuses channel components)
│       │       └── settings/page.tsx
│       ├── components/
│       │   ├── ui/                  # shadcn/ui primitives
│       │   ├── layout/              # Sidebar, TopBar, CommandPalette
│       │   ├── inbox/               # InboxCard, InboxList, InboxActions
│       │   ├── channel/             # MessageList, MessageItem, MessageInput
│       │   ├── integrations/        # GitHubPRCard, LinearTicketCard
│       │   ├── bot/                 # BotMessage, BotThinking
│       │   ├── proactive/           # DraftReminder, UnansweredBanner, PRReviewNudge, IncidentRouter, BlockedTaskAlert
│       │   └── auth/                # AuthProvider
│       ├── hooks/                   # useAuth, useChannel, useInbox, useBotQuery
│       └── lib/                     # workos.ts, utils.ts, constants.ts
├── packages/
│   └── shared/                     # Shared TypeScript types + Zod validators
├── convex/                          # Convex backend (root-level per convention)
│   ├── schema.ts                   # All table definitions (10 tables)
│   ├── auth.ts, users.ts, channels.ts, messages.ts
│   ├── inbox.ts, integrations.ts, bot.ts, summaries.ts, ingest.ts
│   ├── drafts.ts                   # Draft persistence + AI completion suggestions
│   ├── proactive.ts                # Proactive AI agents
│   ├── crons.ts                    # CRON schedule (summaries, proactive scans)
│   ├── http.ts                     # HTTP router for webhooks
│   └── webhooks/                   # github.ts, linear.ts, workos.ts
├── services/
│   └── knowledge-engine/           # Express + Graphiti + Neo4j
│       ├── docker-compose.yml
│       ├── src/
│       │   ├── index.ts, graphiti-client.ts, ingest.ts, query.ts, seed.ts
│       └── Dockerfile
└── scripts/
    ├── seed-demo-data.ts
    └── setup-dev.sh
```

---

## Convex Schema (10 tables)

- **`users`** — WorkOS identity, email, name, avatar, role, workspace, status, lastSeenAt
- **`workspaces`** — name, slug, WorkOS org, integrations config
- **`channels`** — name, description, workspace, type (`"public" | "dm" | "group"`), isPrivate, isDefault, isArchived
- **`channelMembers`** — channel, user, lastReadAt
- **`messages`** — channel, author, body, type (user/bot/system/integration), integrationObjectId, citations, mentions, graphitiEpisodeId
- **`integrationObjects`** — workspace, type (github_pr/linear_ticket), externalId, title, status, url, author, metadata
- **`inboxSummaries`** — user, channel, bullets (3 with Eisenhower priority: urgent-important / important / urgent / fyi), action items, read/archived state
- **`drafts`** — user, channel, body, replyToMessageId, contextSnapshot, suggestedCompletion, status
- **`proactiveAlerts`** — user, workspace, type (7 types: unanswered_question, pr_review_nudge, incident_route, blocked_task, fact_check, cross_team_sync, draft_reminder), channel, title, body, suggestedAction, priority, status, expiresAt
- **`sessions`** — user, WorkOS session, expiry

---

## Sprint Overview

| Sprint | Days | Focus |
|--------|------|-------|
| Phase 0 | Day 0 | Project setup, tech spikes, dev environment |
| Sprint 1 | Days 1-3 | Foundation: schema, auth, UI shell |
| Sprint 2 | Days 4-7 | Core messaging, drafts, CRON summaries with Eisenhower ranking |
| Sprint 3 | Days 8-12 | Copilot Inbox (Eisenhower-ranked cards), @KnowledgeBot, webhooks, unanswered Q + PR nudge agents |
| Sprint 4 | Days 13-16 | Intelligence: citation UI, incident routing, blocked tasks, proactive fact-checking, cross-team syncing, all agents |
| Sprint 5 | Days 17-20 | Polish, demo data, testing, deployment |

---

## Scope Cuts (NOT in MVP)

Complex threading, file uploads, production SAML/SSO, custom agent builder, mobile app (Expo), advanced RBAC, audit logging, emoji reactions, message editing/deletion, notification sounds, dark/light theme toggle, PagerDuty/Datadog direct webhooks, user-configurable proactive thresholds.

---

## Final Demo Flow

1. Flood 100 messages in #engineering and #product
2. Switch to Copilot Inbox — **Eisenhower-ranked cards** appear (Urgent+Important at top, FYI at bottom)
3. Ask "@KnowledgeBot how did we decide on the DB schema?" — cited answer with source pills
4. Start typing a reply, switch channels — Draft Reminder appears when returning
5. See "Unanswered Question" alert for a teammate's question
6. See "PR Review Nudge" for a stale PR
7. **Proactive Fact-Check**: user posts wrong assumption in #engineering — Knowledge Agent auto-replies: "Actually, we tried that in Q3, see [cited PR]" *(Aha moment #2 from pitch)*
8. **Cross-Team Sync**: AI surfaces context from #product in #engineering: "FYI: Frontend team is shipping a fix for this on Monday" *(Aha moment #3)*
9. Post incident in #incidents — AI auto-routes to the right engineer
10. See "Blocked Task" alert when a blocking PR is merged

For detailed per-developer plans, see the individual files in this directory.
