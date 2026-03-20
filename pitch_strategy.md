# PING: AI-First Open-Core Strategy & Pitch

## 1. The Problem Space: Why People Hate Slack & Teams
Current chat platforms were designed for a purely human-to-human, synchronous era. They are "dumb pipes" that simply deliver messages, leaving the cognitive load of parsing, prioritizing, and acting on that information entirely to humans. 

**The pain points:**
*   **UI/UX Clutter & Mobile Nightmares:** Teams and Slack feel bloated, slow, and overly complex. Their mobile apps are adapted for reading short texts, not catching up on structured company decisions on the go.
*   **The Context-Switching Tax:** Chat apps are completely siloed from where work actually happens. Jumping between Jira, GitHub, Linear, and Slack just to understand a project's status drains productivity.
*   **Information Overload & "Unread Anxiety":** Users return from deep work or sleep to a "wall of text" and red badges. Finding what actually matters is a manual, anxiety-inducing process.
*   **Context Fragmentation & Ephemeral Knowledge:** Important decisions get buried in endless threads. When someone new joins, or a similar issue arises 6 months later, that knowledge is practically lost.
*   **Bolt-on AI is Clunky:** Existing tools treat AI as an app integration (a bot you talk to) rather than a native intelligence layer that understands the entire workspace.

## 2. The Problem (Defined for Investors)
**"Knowledge workers spend 20% of their day searching for internal information or catching up on communications. Legacy chat apps (Slack, Teams) exacerbate this by treating all messages with equal priority and acting as transient data silos."**

We are solving the **Enterprise Context Cost**. Companies are paying highly skilled workers (developers, PMs) to act as human routers—reading, summarizing, and repeating information. 

## 3. Alternative Cost (What happens without us?)
If companies stick to the status quo, they incur massive hidden costs:
1.  **Time Waste:** 1-2 hours per employee per day spent reading irrelevant updates or searching for lost links/decisions. 
2.  **The Context Switching Tax:** The constant friction and lost focus of jumping between Jira, GitHub, Slack, and Notion just to merge a single PR or close a ticket.
3.  **Tool Sprawl Cost:** Paying for Slack ($15/user) + Notion AI ($10/user) + Glean/Enterprise Search ($40/user) + Zapier ($$$) to try and force intelligence into dumb chat.
4.  **Lost Velocity:** Wait times. An engineer in Europe blocked on a deployment issue waits 8 hours for the US DevOps lead to wake up and answer a question that was already solved in a different channel last year.

## 4. Target Personas
To maximize PMF and leverage the Open-Core model, we need bottom-up adoption from technical users who feel the pain of context-switching the most.

**Primary Persona: "The Overwhelmed DevOps/Eng Lead" (Bottom-up Champion)**
*   **Profile:** CTO, VP of Eng, or Lead Developer at a 50-250 person startup.
*   **Pain:** Spends half their day answering "How do I..." questions in Slack, breaking their flow state. Worries about vendor lock-in and data privacy with proprietary AI tools.
*   **Why they buy:** They can self-host the open-core version on a Friday afternoon using Docker. It instantly saves them 10 hours a week by auto-answering repetitive team questions.

**Secondary Persona: "The glued-together Ops Manager" (Expansion User)**
*   **Profile:** Head of Ops, Product Manager, or Support Lead.
*   **Pain:** Constantly moving data between Zendesk, Jira, and Slack.
*   **Why they buy:** Visual "AI employee" deployment means they can build auto-routing workflows without writing code.

## 5. The Pitch (The Narrative)
**The Hook:** "Slack was built for the human era. PING is the communication protocol for the AI era."

**The Vision:** "We are inverting the enterprise chat model. In legacy chat, humans talk and bots occasionally listen. In our platform, the AI is the primary router of information. We don't just host chat; we are **Integration-First**. GitHub PRs, Linear issues, and Sentry alerts aren't just dead links—they are native objects that the AI understands and acts upon without you ever leaving the chat UI."

**The Moat & Business Model (Why it's investable):** 
"We use an Open-Core model (like Linear/PostHog) to drive massive, cheap bottom-up developer adoption. But our true moat is our **Graph-RAG Knowledge Graph**. Because every message, Slack integration, and Linear ticket is mapped relationally, the longer a company uses us, the smarter their workspace becomes. Moving back to Slack would mean losing their company's digital brain. We monetize via SaaS hosting, compute scale, and enterprise features immediately via WorkOS."

---

## 6. The 3-Day MVP Execution Plan (5 Devs)
With 3 days and 5 developers, you cannot build all of Slack. You must build the **"Aha!" moment** that proves the AI-first thesis. 

**The Goal:** Prove the new UI paradigm (Linear-style inbox over Slack channels) and the power of Graph-RAG answering questions instantly based on integrations.

**The Tech Stack (Optimized for Speed):**
*   **Backend & State:** **Convex**. Perfect for this. It handles real-time WebSocket sync inherently, has built-in vector search/CRON jobs for AI polling, and acts as the reactive backend-as-a-service.
*   **Identity & Enterprise Ready:** **WorkOS**. Drop this in on Day 1. It provides ready-to-go SAML SSO and directory sync. This instantly proves you can sell to mid-market/enterprise without building complex auth flows.
*   **Knowledge Graph (Graph-RAG):** **Graphiti** (or similar semantic tool). Instead of just dumping regular vectors into Postgres, build a semantic relationship graph. The AI knows *who* wrote the code, *what* Linear issue it relates to, and *which* chat thread spawned it.
*   **Frontend / Mobile:** React Native (Expo) or responsive Next.js/Tailwind. The UI must feel like Linear—keyboard shortcuts, command palettes, and an "Inbox" model focused on action, not endless scrolling on mobile.

**Resource Allocation:**
*   **Dev 1 & 2 (Frontend UI/UX):** Next.js UI. Focus on a radical redesign: A "Copilot Inbox" where the AI pre-reads channels and presents actionable cards (e.g., "3 PRs need review", "New Jira ticket assigned").
*   **Dev 3 (Backend & Auth):** Convex schema design & real-time sync + WorkOS integration for instant enterprise readiness.
*   **Dev 4 (Knowledge Engine):** Build the ingestion pipeline using Graphiti to map relationships between incoming chat messages and simulated Linear/Jira/GitHub webhooks.
*   **Dev 5 (AI Agents):** Build the `@KnowledgeBot` that queries the Graphiti/Convex backend when mentioned and formulates an answer.

**Scope Cuts (DO NOT BUILD IN 3 DAYS):**
*   Direct Messages (DMs)
*   Complex threaded UI (just use a flat channel for now)
*   File uploads (focus strictly on text/code snippets)
*   SAML/SSO (just use simple magic links or Google Auth)
*   Custom Agent Builder (hardcode one powerful answering bot)

**The Demo Flow (Day 3):**
1.  Flood the channel with 100 messages of dense technical discussion between humans.
2.  Switch to the "Copilot Inbox" to show a beautiful, 3-bullet-point summary of the decisions made. *(Aha moment #1)*
3.  Ask the channel, "@bot how did we decide to configure the database earlier?" 
4.  The bot replies instantly with the exact context and cites the specific messages from the flood. *(Aha moment #2)*
