# Agent Grid — Hosted Console Redesign Spec

> **Audience:** a developer/designer rebuilding `apps/approval-web` (the React console
> served from Vercel, talking to the Railway backend relay).
>
> **Scope:** web console only. Mobile companion app (`apps/approval-mobile`) is out of
> scope for this redesign — keep it untouched.
>
> **What this doc is:** the complete UI/UX surface — every screen, every state, every
> interaction, every piece of content. Implementation guidance for visuals is intentionally
> light (see §2 Design Philosophy).
>
> **What this doc is not:** visual design (no colors, no spacing, no layout grids,
> no typography specs). Those are deliberate choices for the implementer. The doc
> says **what** must be shown and **how it behaves**, not **how it looks**.

---

## 1. What this product is, in one paragraph

Agent Grid is a governance console for AI agents. A human signs up, installs the
Agent Grid MCP on their machine, and connects an agent to their account. From that
point on, the agent performs actions on behalf of the human — browsing, sending
email, paying for things, deploying software. Routine actions happen silently. Actions
that cross a threshold the human set (a payment over $X, any login into a personal
account, any new site signup, anything explicitly flagged as always-ask) pause and
**wait for a human decision in this console**. The console is therefore not a dashboard
of past activity — it is primarily an **inbox of pending decisions** and secondarily
a place to govern policy.

---

## 2. Design philosophy — read this first

These rules are non-negotiable. They are why this doc does not specify colors or
pixel widths.

**2.1  Describe content and intent, not presentation.** Where this doc says "the
agent name and a one-line description", the implementer chooses whether that's a
heading + subhead, a card with metadata, a table row, or a chip. Where the doc says
"the inbox should be empty most of the time", the implementer chooses how to make
that feel calm and reassuring. **The implementer owns the visual language.** This
doc owns what the user sees and what they can do.

**2.2  Surface what matters, hide what doesn't.** The console has two modes: a
near-empty calm state (routine actions are happening, the agent is working) and a
decision-needed state (something crossed a threshold and is waiting). The visual
weight should make those two modes instantly distinguishable. Routine mode should
feel "nothing for you to do, the agent is handling it". Decision mode should make
the pending items unmissable.

**2.3  Never show cryptographic internals.** No full DIDs in the UI (truncate to
a short form unless the user explicitly expands). No signing key material anywhere.
No mention of JWTs, nonces, JCS canonicalization, hash chains, or operator keys.
The customer does not care and should not be exposed to it.

**2.4  The console never holds authority.** The console **does not sign approvals
itself**. It sends `{ decision, reason }` to the backend; the backend signs with the
tenant's operator key. The console never talks to the agent directly — only to
the backend relay. These constraints are security-critical and the UI must never
suggest otherwise (no "approve with your private key" copy, no local signing
animations, nothing that implies the browser is the trust root).

**2.5  Fail loud, fail visible.** When the backend is unreachable, the user must
see that immediately and know the app is retrying. Never show a blank screen. Never
silently swallow an error. Errors are part of the product surface.

**2.6  Speak human, not protocol.** Use "ask me before any payment over $X" — not
"step-up threshold on pay capability". Use "this agent is paused" — not "frozen".
Use "I want to allow this once" — not "issue ad-hoc approval". Translate every
protocol concept into the customer-facing word before it reaches the UI.

---

## 3. Personas & roles

There are two actors in the system. The console primarily serves the human.

**3.1  The Operator (the human)** — the customer who owns the account, set the
policies, and is the source of truth for consequential decisions. They sign in with
their own identity (via Clerk). They see only their own agents and only their own
pending requests.

**3.2  The Agent** — an AI process running on the operator's own machine, connected
to the console via an MCP token. The agent **never logs into the console**. The
agent's only interaction with the console is indirect: it posts approval requests to
the backend, and the backend relays them to the operator's inbox. From the
console's perspective, an agent is a thing-to-be-governed, not a user.

The console therefore has **one auth path** (the operator signing in) and **no agent
login UI**. The phrase "agent login" in the broader product refers to the CLI flow
described in §8.2 — that flow does land in the browser briefly, but it is a
machine-driven browser-open, not a form the operator fills out.

---

## 4. Information architecture

```
NOT SIGNED IN
└── Sign-in / Sign-up page          ← Clerk's hosted auth UI, themed

SIGNED IN, NO AGENTS YET
└── Onboarding (full-screen wizard)
    1. Set your limits
    2. Providers
    3. Connect your agent
    4. Done

SIGNED IN, HAS AGENT(S)
└── Main app
    Primary navigation:
    ├── Governance                  (default landing screen)
    ├── Dashboard
    ├── Inbox                       (badge count of pending)
    └── History
    Secondary navigation:
    ├── Create agent
    ├── Providers
    ├── Devices
    └── Settings
```

The first-run wizard replaces the main app content; it is not a floating overlay.
Once any agent enrolls, the wizard disappears permanently for that account and the
operator lands directly in the main app on Governance.

---

## 5. Global concerns

These apply across every screen unless a screen specifically overrides them.

**5.1  Auth gating.** Every screen except the sign-in page assumes the operator has
a valid Clerk session. On session loss (token expired, sign-out from another tab),
the app returns the operator to sign-in and preserves the URL they were on so they
return after sign-in.

**5.2  Backend connectivity.** The console polls the backend continuously (see §6.7).
When the backend becomes unreachable:
- A persistent banner appears at the top of every screen: "Backend connection
  failed — retrying."
- The app continues to retry automatically; the user does not need to refresh.
- Stale data already shown remains visible but is visually de-emphasized (the
  implementer decides how — the doc only requires it be obvious the data may be
  stale).
- No data is lost; when the backend returns, polling resumes and fresh data
  overwrites stale state.

**5.3  Loading states.** Every screen has a loading state. The implementer chooses
the visual treatment (skeleton, spinner, progressive reveal). The doc requires:
- The screen never renders empty (no flash of nothing) before the first data
  arrives.
- A loading state is visually distinct from an empty state (empty = "no data";
  loading = "waiting on data").

**5.4  Empty states.** Every list-like screen has an empty state. The empty state
must be friendly, explain what would normally appear here, and (where relevant)
point to the action that would create entries. For the inbox specifically, the
empty state is the **most common state** — see §6.7.

**5.5  Error states.** Every screen has an error state for "data fetch failed in a
way that retries can't fix" (e.g. 500 from the backend, validation rejection).
Errors must:
- Say what happened in plain language.
- Offer a retry action.
- Never include a stack trace, error code, or technical jargon.

**5.6  Polling cadence.** The console polls several endpoints. Suggested cadence
(adjust if performance dictates):
- Pending approvals: every 2 seconds (this drives the inbox badge and detail).
- Resolved approvals (history): every 2 seconds.
- Agent list: every 2 seconds.
- Activity feed: every 2 seconds.
- License status: every 10 seconds.

**5.7  Responsive behavior.**
- **Desktop (≥1024px wide):** persistent left navigation, main content scrolls.
- **Tablet (768–1023px):** persistent left navigation, narrower; some multi-column
  layouts collapse to single column.
- **Mobile (<768px):** top app bar with logo + Inbox + user avatar; the navigation
  collapses into a drawer or bottom bar (implementer chooses). Multi-column layouts
  become single column. The Inbox list and Inbox detail become alternating full-screen
  views (list → tap → detail → back → list).

**5.8  Accessibility.** All interactive elements must be reachable by keyboard with
visible focus. All actionable icons must have an accessible label. Color is never
the only signal (e.g. "frozen" must also carry a label or icon, not just a colored
dot). Pending counts must be announced to screen readers when they change.

---

## 6. Every screen

### 6.1  Sign-in / Sign-up page

**When shown.** Whenever the operator is not signed in. This includes first-visit
arrivals, expired sessions, and sign-out.

**Content & behavior.** Clerk's hosted sign-in component handles everything: email +
password, OAuth providers (Google, GitHub, etc. — whatever Clerk is configured with),
sign-up flow, password reset, email verification. The console's only job is to
embed Clerk's component and theme it to feel consistent with the rest of the app.

**What must NOT be on this screen.** No mention of tokens, API keys, MCP, agents,
backend URLs, or any product terminology. The operator should see only "sign in" /
"sign up" / "forgot password" — clean and standard.

**After sign-in.** The console checks for agents. If none, → onboarding. If at least
one exists, → Governance screen.

**Session preservation.** If the operator was deep-linked with a `?returnTo=…` URL
parameter (e.g. clicking "view this approval" from an email link), return them to
that screen after sign-in. If no `returnTo`, default to Governance.

---

### 6.2  Onboarding wizard

**When shown.** The operator is signed in and has zero agents enrolled. Every new
customer lands here. Once dismissed (either by completing it or skipping past the
last step), it stays dismissed for that account across reloads and across
sessions.

**Form factor.** Full-screen wizard, not a modal overlay. The wizard **is** the
main app content until the operator has at least one connected agent. The left
sidebar nav and top bar are hidden during the wizard; only the wizard itself
renders. (This is a deliberate simplification — at zero agents there is nothing
in the sidebar worth showing.)

**Step indicator.** Show the operator where they are in the flow: a step counter
("Step 2 of 4") or a progress indicator. The implementer picks. The operator must
be able to skip back to a previous step but never forward past an incomplete one.

#### 6.2.1  Step 1 — Set your limits

**Purpose.** Capture the operator's intent: what should the agent be able to do
without asking, and where must it stop and ask?

**Content.**
- **Agent name** — free-text field. Defaults to something reasonable (e.g. "My
  agent" or the operator's display name). The operator can rename later.
- **Ask me before any payment over ___** — currency input (default currency
  inferred from operator locale; allow change).
- **Monthly payment cap: ___** — currency input.
- **Always ask before logging into my personal accounts** — toggle, on by default.
  When on, any login into a service flagged as user-owned requires explicit
  approval, regardless of any other rule.
- **Always ask before signing up for new accounts** — toggle, on by default.

**Behavior.**
- The operator must hit "Save and continue" once to advance, even if they keep
  every default. This is intentional: it confirms they have seen the limits.
- Values persist via `POST /api/config`. On reload, current values are pre-filled
  from `GET /api/config`.
- After save, advance to step 2.

**Validation.**
- Currency inputs must be non-negative numbers. Empty is allowed (interpreted as
  "no cap").
- "Ask before any payment over" must be ≤ "Monthly payment cap" if both are set;
  if not, show an inline message explaining the relationship and how to fix it.
  Do not block save — let the operator proceed with whatever they set.

**What must NOT be on this screen.** Any mention of "mandates", "scopes",
"thresholds in minor units", "DIDs", or any protocol term.

#### 6.2.2  Step 2 — Providers

**Purpose.** Show the operator which capabilities are wired up and which need
attention. Informational; skippable.

**Content.** A list of capability cards (browse, email, SMS, cloud, payments).
Each card shows:
- A name (e.g. "Email").
- A one-sentence description of what it enables the agent to do.
- A status: "Connected" / "Not configured".
- When not configured, a short hint about what to set (an env var name and one
  sentence explaining what it is). The hint names the env var because the
  operator will need to type it on their machine — but the implementer should
  frame it helpfully, not as raw config.

**Behavior.**
- This screen is read-only — there are no toggles or buttons here. Configuration
  happens on the operator's own machine where the MCP runs.
- "Continue" advances to step 3. "Skip for now" also advances to step 3 (same
  effect).

**API hint.** `GET /api/providers` returns the list of providers with status.

#### 6.2.3  Step 3 — Connect your agent

**Purpose.** Walk the operator through installing the MCP and connecting it. This
is the most important step — until an agent enrolls, the rest of the app is
inert.

**Content.**
- **Two commands** in copy-pasteable form:
  ```
  npm install -g agent-grid-mcp
  agent-grid-mcp login
  ```
- A one-sentence explanation of what each does. No JSON. No tokens in this view.
- A live status indicator: "Waiting for your agent to connect…" while polling.
  When `GET /api/agents` returns a non-empty list, the indicator flips to
  "✓ Agent connected!" and the wizard auto-advances to step 4.
- **A "Show manual setup" toggle** for AI clients that can't do the browser-redirect
  login. When expanded, show the MCP JSON config snippet with a "Copy" button:
  ```json
  {
    "mcpServers": {
      "agentgrid": {
        "command": "agent-grid-mcp",
        "env": { "AGENTGRID_TOKEN": "ag_xxxxxxx" }
      }
    }
  }
  ```
  The token is fetched via `POST /api/tokens` (one-time, then hidden after
  shown). Do not include any backend URL in this snippet.

**Behavior.**
- The screen stays here, polling, until an agent enrolls. There is no "skip"
  on this step — without an agent, the app has no purpose.
- If the operator closes the browser and comes back, the wizard resumes at this
  step and resumes polling.
- If the operator's session token expires while polling, the app handles sign-in
  flow and returns to this step.

**API hint.**
- `GET /api/agents` polled every 3 seconds until non-empty.
- `POST /api/tokens` (one-time) when the manual snippet is expanded.

**What must NOT be on this screen.** Any reference to localhost being used by the
console itself (the operator may run the CLI's localhost callback, but the
console's own backend is never on localhost — see §9).

#### 6.2.4  Step 4 — Done

**Purpose.** Confirm completion and route the operator into the main app.

**Content.** A short success message ("Your agent is connected.") with a single
primary action: "Go to console" → navigates to Governance.

**Behavior.** Auto-advance is acceptable here — if the operator is staring at the
screen and the agent is connected, advance them after a short delay (3–5
seconds) without requiring a click.

---

### 6.3  Main app shell

**Persistent chrome across all main-app screens:**
- **Left navigation** (desktop) or **top bar + drawer/bottom nav** (mobile).
  Contents: app logo + wordmark, the primary nav items, the secondary nav items,
  the inbox badge count, and the operator's user avatar/menu (sign out, account
  settings link). The logo and product wordmark link to Governance.
- **Persistent banner slot** at the top of the content area, used for the
  backend-down banner (§5.2) and the unlicensed banner (if applicable).
- **Page header** area within each screen, containing the screen title and any
  in-screen actions.

**Primary nav items (in this order):**
1. Governance (default landing)
2. Dashboard
3. Inbox (with a badge count of pending approvals — appears only when count > 0)
4. History

**Secondary nav items (visually separated from primary, in this order):**
5. Create agent
6. Providers
7. Devices
8. Settings

**State preservation.** When the operator switches between screens, the scroll
position and any local view state (selected agent, expanded card, etc.) is reset
per screen unless the operator navigates back and forth. Across reloads, the
last visited screen is restored if the route permits.

---

### 6.4  Governance screen (default landing)

**Purpose.** Give the operator a one-glance view of every agent and its
governance posture. This is the screen that answers "is everything healthy?"
without requiring the operator to click anything.

**Content per agent.** A card or row per enrolled agent showing:
- Agent name (set by the operator) and a shortened agent identifier (truncated
  DID; never the full DID).
- Freeze status with a label ("Active" / "Frozen"). When frozen, show the reason
  and since-when.
- A one-line status summary per governance primitive (mandate / policy / vault /
  audit / identity). Each primitive shows "OK" or "Needs attention" with a short
  label, never a raw status code. The operator does not need to know what
  "mandate" means — frame as "the rules you set are in effect" / "expired".
- A "Freeze" / "Unfreeze" action directly on the card.
- A "View details" link to a per-agent governance detail (see §6.4.1).

**Empty state.** "No agents enrolled yet" with a single primary action:
"Connect an agent" → re-opens the onboarding wizard at step 3, OR routes to
"Create agent" if the operator prefers manual setup.

**Behavior.**
- Freeze → `POST /api/agents/{agentDid}/freeze` with a required reason (pop up
  a small inline prompt: "Why are you freezing this agent?" with a free-text
  field). Confirm before freezing. Freeze takes effect on the agent's next
  contact with the backend; the UI does not need to wait.
- Unfreeze → `POST /api/agents/{agentDid}/unfreeze`. Immediate. The agent
  resumes on its next action.
- Multiple agents → stack the cards vertically. Each card is independently
  freezable.

**API hint.** Per agent: `GET /api/agents/{agentDid}/governance/overview` (or
the existing list endpoint with the governance fields expanded). The list itself
comes from `GET /api/agents`.

#### 6.4.1  Per-agent governance detail

**Purpose.** Deep view into one agent. Where the card on Governance is a
summary, this screen is the full breakdown.

**Content.** For the selected agent:
- **Identity section** — display name, shortened agent ID, status, the operator
  (human) it belongs to.
- **Mandates section** — each mandate as a row, showing: what it covers
  (capability, in human terms), the limits it sets (in operator-friendly units,
  not minor units), its validity window, and its status. Revoke action per row.
- **Policy section** — recent policy decisions (verdict + reason in plain
  language + timestamp). Filterable by capability.
- **Vault section** — what credentials the agent can use, in human terms (e.g.
  "email login for example.com"), grouped by trust domain. Never shows raw
  values, never shows handles or secrets.
- **Card / spend section** — if the agent has a virtual card: last 4 digits
  (in human form), current period spend vs limit, per-transaction cap,
  category allow/deny. No PAN ever.
- **Audit section** — recent activity entries, with a "verify chain" status
  indicator ("Verified" / "Issue at entry N — view"). The audit export action
  lives here.
- **Lifecycle** — current activity state (idle / running / waiting-on-input /
  frozen), most recent action, what the agent is currently waiting on (if
  anything). This connects directly to the inbox — if the agent is waiting on
  a step-up approval, a deep link to that approval appears here.

**Behavior.** Revoke mandate → `POST /api/mandates/{id}/revoke`. Export audit
→ downloads a JSON file via `GET /api/agents/{did}/audit/export`. Card limit
edits → `POST /api/cards/{handle}/limits`. All mutations require a confirmation
step.

---

### 6.5  Dashboard

**Purpose.** An at-a-glance summary of recent activity across all agents. Read-only.
For operators who want to see "what has been happening lately" without diving into
per-agent governance.

**Content.**
- **Agent strip** — for each agent: name, current status, a one-line "most
  recent action" if any, and a link to the per-agent detail.
- **Activity feed** — chronological list of recent events (last N, e.g. last 50),
  each entry showing: agent name, capability (in human terms), action summary,
  verdict, timestamp. Grouped by day.
- **Spend summary** (if any agent has a card) — total spend this period across
  all agents, period limit, time remaining in the period.

**Behavior.** Clicking an activity entry navigates to that agent's governance
detail with that entry highlighted (if linking is supported) or to the History
screen filtered to that action. Clicking an agent strip card navigates to that
agent's governance detail.

**Empty state.** "No activity yet. Once your agent starts working, you'll see
what it's been doing here."

**API hint.** Reuses `GET /api/agents`, `GET /api/activity`, and (for spend) a
spend-summary endpoint if it exists; otherwise compute client-side from the
card views.

---

### 6.6  Inbox (pending approvals) — the most important screen

**Purpose.** Surface every decision that is waiting on the operator. This is the
screen the operator will visit most often when something needs attention, and
should feel "all clear" when nothing does.

**Empty state (the default).** A calm, friendly empty state. The message is
reassuring, not punitive. Convey: nothing needs you right now; the agent is
working within its mandate. Use language that frames routine autonomy as the
healthy state, not the absence of the app's purpose. Suggested copy: "All clear
— nothing needs you right now. The agent is acting within the rules you set."

**Populated state — list + detail pattern.**
- **List (left column on desktop, full-screen on mobile):** every pending
  approval as a row. Each row shows: capability (in human terms), a short
  description of the action, the agent name, how long the agent has been waiting,
  and a relative urgency cue (newest at top, or oldest at top — implementer
  decides; whichever feels calmer). Tappable to open the detail.
- **Detail (right column on desktop, full-screen on mobile):** the selected
  request in full. See §6.6.1.
- The first request is auto-selected when the list becomes non-empty (so the
  operator sees the most pressing item without an extra click). Selection state
  is cleared when the list empties (so the empty state shows cleanly).

**Behavior.**
- List auto-refreshes via the 2-second poll (§5.6). New entries appear at the
  top with a subtle entrance cue (the implementer chooses: fade, slide, badge
  pulse — whatever fits the calm-by-default design).
- When a request is resolved (by the operator or by auto-deny on expiry), it
  disappears from the inbox within 2 seconds and appears in History.
- On mobile, tapping a list row navigates to the detail view; a back button
  returns to the list. There is no swipe-to-dismiss for individual requests.

#### 6.6.1  Approval detail card

**Purpose.** Give the operator everything they need to make the decision, and
nothing they don't.

**Content.**
- **Header** — capability name (human form: "Payment", "Email login", "Website
  signup", "Deploy"), and a one-line summary.
- **Body** — the specifics:
  - For a payment: amount and currency, merchant, what the agent is buying or
    paying for.
  - For a login / signup: the service, the account being accessed (e.g.
    "your example.com account" if user-owned; "a new account the agent is
    creating" if agent-owned), the reason the agent needs access.
  - For a deploy: what is being deployed, where.
  - For an email / SMS: the recipient, the message purpose.
- **Rationale** — the agent's stated reason for this action, in plain language.
  This is the operator's main context for the decision.
- **Timing** — how long the agent has been waiting, and how long until the
  request auto-denies if the operator does nothing. The countdown should be
  visible but not panicked — most waits are longer than the operator needs.
- **Approve button** — primary action. Disabled until the operator has typed a
  reason.
- **Deny button** — secondary action. Also requires a reason.
- **Reason field** — free-text, required for both approve and deny. The reason
  is recorded in the audit ledger and surfaces in History. Placeholder text
  suggests useful reasons ("Looks fine", "Wrong merchant", "Try a cheaper
  option", etc.) but the field accepts anything.

**What must NOT be on this card.**
- The agent's full DID or any cryptographic identifier.
- The nonce or expiry timestamp in raw form (the countdown can show a duration
  like "expires in 2m 14s", not a timestamp).
- Any mention of JWTs, signing, approval channels, or transport internals.
- Raw `error codes` from the backend.

**Behavior.**
- Approve → `POST /api/approvals/{id}/decision` with `{ decision: "approved",
  reason }`. On 200, the request leaves the inbox and appears in History within
  2 seconds. The next list item auto-selects.
- Deny → same endpoint, `{ decision: "denied", reason }`. Same follow-through.
- On error (network, 5xx, 4xx): keep the card visible, show an inline error
  message, do not clear the form, allow retry. The operator's typed reason
  must survive across retries.
- The decision is **irrevocable** from the UI. If the operator approves and
  changes their mind, they cannot un-approve from this screen. (A future
  "undo" is out of scope; the audit log is the source of truth.)

---

### 6.7  History

**Purpose.** The full record of resolved approvals — every approved and every
denied. The operator can review what they have decided and why.

**Content.** Chronological list (newest first), each entry showing:
- Agent name.
- Capability (human form) and a short action description.
- Decision: "Approved" / "Denied" — visually distinct but always with a label
  (never color-only).
- Reason given.
- Resolved at (relative time on hover or tap → absolute timestamp).
- If the action was approved and executed, the outcome summary (e.g. "Payment
  sent to merchant", "Email delivered"). If denied, no outcome.

**Behavior.** Read-only. No actions on history entries from this screen
(revoking an approved mandate happens in the per-agent governance detail;
re-running an action is the agent's job).

**Empty state.** "No history yet. Once you start approving or denying requests,
they'll show up here."

**Filtering (optional but recommended).** Filter by agent, capability, or
decision. Filter controls in the page header; the implementer picks the
treatment (chips, dropdown, segmented control).

**API hint.** `GET /api/approvals/history` (already part of the existing
polling).

---

### 6.8  Create agent

**Purpose.** For operators who want to enroll an agent manually (not via the
CLI login flow). Useful for scripted or programmatic setup, and for AI clients
that cannot do the browser-redirect login.

**Content.**
- **Agent name** — free-text field.
- **Limits** — same fields as onboarding step 1 (payment threshold, monthly
  cap, always-ask toggles).
- **Submit** — generates a token via `POST /api/tokens` and shows the manual
  setup snippet (the same JSON as onboarding step 3's manual toggle, see
  §6.2.3). The snippet includes a "Copy" button. After copy, the screen shows
  a "Token created — paste this into your MCP config and restart your client"
  message with a "Done" action that returns the operator to Governance.

**Behavior.**
- The token is shown exactly once. The console does not store it in a way
  that allows the operator to retrieve it later — if they lose it, they
  mint a new one.
- "Done" returns to Governance. The operator's new agent will not appear until
  the MCP they configured calls `POST /api/enroll` (which the implementer
  cannot trigger from here; the operator must complete that step on their
  machine).

---

### 6.9  Providers

**Purpose.** Show the current status of every capability and how to enable
the ones that aren't.

**Content.** Same as onboarding step 2 (§6.2.2). Read-only list of capability
cards. When not connected, show the env var hint that needs to be set on the
machine running the MCP.

**Behavior.** No mutations. "Refresh status" optional button — calls
`GET /api/providers` on demand in addition to polling.

---

### 6.10  Devices

**Purpose.** Manage phone devices linked to this account for mobile approvals
(via the companion app, out of scope of this spec).

**Content.**
- List of currently linked devices (one row per device: device name, enrolled
  date, last seen, a "Remove" action per device).
- A primary action: "Link a new device" — reveals a QR code containing the
  enrollment payload. The phone app scans this to enroll.

**API hint.** `GET /api/devices` and `DELETE /api/devices/{token}`.

---

### 6.11  Settings

**Purpose.** Edit the operator-level configuration that onboarding captures at
first run, and manage the license (if licenses exist in the current phase).

**Content (two sections).**

**Section A — Agent configuration.**
Same fields as onboarding step 1: agent name (note: applies to the default
agent — if multiple agents exist, this section may apply to "the primary" or
list per-agent; the implementer matches the existing data model), payment
threshold, monthly cap, always-ask toggles. "Save" persists via
`POST /api/config`.

**Section B — License (if licensing is enabled in the current phase).**
- Current license status (active / expired / not set) with expiry date if active.
- "Activate license key" form — text input + Activate button. On 200, refresh
  status and show the new state. On error, inline message in plain language.
- If a license is active: "Deactivate" action (with confirmation).

**Behavior.** Settings changes persist immediately on Save. There is no
"unsaved changes" warning — the implementer may include one if standard
practice, but it is not required.

**Empty / disabled states.**
- If licensing is not yet enforced in this build, the License section is
  hidden entirely (not shown as "disabled").
- If a license becomes required at runtime (e.g. trial expired), an unlicensed
  banner appears on every screen with an "Activate" button that deep-links to
  this section.

---

## 7. Component patterns

These are not screens — they are reusable patterns the implementer will reach
for across screens. The doc describes intent and content; the implementer
chooses the visual treatment.

**7.1  Status pill / badge.** Used to convey a single binary state ("Active",
"Frozen", "Connected", "Not configured"). Always paired with a label; color
alone is never the signal.

**7.2  Action card.** A self-contained unit combining a title, a one-line
description, a primary action, and (sometimes) a secondary action. Used for
the empty states that have a CTA (Governance empty, Providers, etc.).

**7.3  Decision row.** Used in the inbox list and history. Compresses a
capability + action + agent + timing into a single tappable row. Designed to
be scannable — the operator should be able to glance at a list of 10 and
identify the urgent one in under 2 seconds.

**7.4  Detail panel.** Used on the right column of the inbox (and per-agent
governance detail). All decision-relevant content lives here; nothing in here
is for decoration.

**7.5  Banner.** Top-of-screen persistent or transient. Used for backend-down,
unlicensed, and (in future) maintenance. Dismissible only when the condition
is operator-resolvable; non-dismissible when it indicates a system state the
operator should keep seeing.

**7.6  Confirmation prompt.** Used for irreversible actions (freeze,
mandate revoke, license deactivate). Inline prompt near the action is
preferred over a modal — modals are reserved for the cases where the operator
must read something before continuing (e.g. showing a long reason for a
freeze).

---

## 8. Auth flows — step by step

### 8.1  User sign-in / sign-up

1. Operator opens the console URL.
2. Console checks for a valid Clerk session.
3. **No session:** show sign-in page. Clerk's hosted UI handles the rest.
4. **Valid session:** console calls `GET /api/agents` (and `GET /api/config`,
   `GET /api/providers`).
5. If `agents` is empty: route to onboarding.
6. If `agents` is non-empty: route to Governance.
7. If a `?returnTo=…` URL parameter is present (operator was deep-linked from
   an email), route to that screen instead — as long as it exists and the
   operator is authorized for it.

**Account auto-provisioning.** The first time the operator's Clerk identity
hits the backend, the backend auto-creates a tenant (operator signing key,
DB row). The console never displays this; it just works.

### 8.2  Agent login (the CLI-driven browser flow)

This is the flow the customer runs when they install the MCP. It is the only
time the agent's interaction with the browser is initiated. **The console does
not present an "agent login form"** — the console presents the regular sign-in
flow, with one side-effect.

**Sequence.**
1. Operator runs `agent-grid-mcp login` in their terminal.
2. The CLI starts a temporary HTTP server on a random local port (e.g. 52341)
   and opens the browser to `https://agent-grid-web.vercel.app?login_cli_port=52341`.
3. **Critical:** before any auth state is evaluated, the console reads
   `login_cli_port` from the URL and persists it (e.g. to `sessionStorage`).
   This must happen in code that runs **before Clerk decides auth state** —
   the value must survive Clerk's auth redirect, which strips URL search
   params.
4. If the operator is not signed in, the sign-in page renders. After sign-in,
   the URL no longer has `login_cli_port`, but `sessionStorage` still does.
5. After sign-in, the console reads the port from `sessionStorage`. If found,
   it mints a token via `POST /api/tokens` and redirects the browser to
   `http://localhost:{port}/callback?token={ag_token}`.
6. The CLI's local server receives the callback, saves the token, prints
   "Authenticated!", exits.
7. The console returns to its normal post-sign-in flow (onboarding if no
   agents, else Governance).

**Visual treatment during this flow.** The operator briefly sees the sign-in
page, then a redirect happens. The console should **not** show any "agent
login" UI, "device pairing" UI, or "authorizing your agent" UI during this —
the operator is signing into their own account and the CLI is just listening
on a local port for a token redirect. Showing extra UI here would confuse the
operator ("why is it asking me to authorize a device?"). The redirect happens
and the operator continues.

**Failure cases.**
- The CLI's local server never gets a callback (e.g. the operator closes the
  browser too early). The console doesn't know — it just routes to its normal
  post-sign-in screen. The CLI will time out and print an error in the
  terminal.
- The port in `sessionStorage` is stale from a prior aborted login. The
  console redirects anyway; the CLI may or may not be listening. The operator
  sees no error in the browser; the CLI handles it.

**What the console must never do during this flow:**
- Display the token visibly to the operator. The redirect carries it; the
  operator never sees it.
- Display any "agent is connecting" UI here. The MCP will enroll on its own
  schedule; the wizard's step 3 polling will pick that up later.
- Strip `login_cli_port` from `sessionStorage` until the redirect has fired,
  or until the operator explicitly cancels the flow.

---

## 9. Constraints the console must honor

These are not UI choices — they are hard rules that the UI must not violate.

1. **Never talk to localhost for backend traffic.** The backend URL is
   compile-time configured (`VITE_AGENTGRID_API` → Railway). Localhost
   appears in only one place in the entire app: the `login_cli_port`
   redirect target, and only because that is calling the CLI's temporary
   local server (a CLI-to-CLI call, not a backend call).
2. **Never talk to the MCP directly.** The console has no protocol with the
   agent. It only talks to the backend relay.
3. **Never sign an approval itself.** The console sends `{ decision, reason }`
   to the backend; the backend signs with the operator's vault-held key. The
   console must never produce a signature, show a "signing…" indicator, or
   imply the browser is performing cryptography on the operator's behalf.
4. **Never show a full `ag_` token in any post-onboarding screen.** The token
   is shown once in the Connect step and once in Create Agent. After that,
   the operator's Clerk session is their auth — they never need to see or
   manage tokens in the UI.
5. **Never show approvals from other tenants.** The backend scopes every
   response by the calling user's ID. The console must not attempt to
   cross-filter across tenants — it cannot, and trying to implies the
   data is shared.
6. **Never show a blank screen on backend failure.** The retry banner must
   appear (§5.2) and the app must keep trying. The operator should never
   stare at a blank page wondering if something is wrong.
7. **Never require the operator to type the backend URL.** It is compile-time
   configured. The operator does not need to know what Railway is.
8. **Never expose cryptographic internals in the UI.** No full DIDs, no key
   material, no signatures, no hash chains, no nonces in raw form.

---

## 10. Known issues to address during the redesign

These are carry-overs from the existing implementation that the redesign
should fix (or consciously re-break in the same way).

**10.1  CLI callback persistence.** The current code reads `login_cli_port`
inside the `App` component, which only mounts after sign-in. By then Clerk's
auth flow has stripped the URL param and the port is lost. **Fix in redesign:**
read the URL param at the absolute root of the React tree, before any auth
gating. Persist to `sessionStorage` immediately. The redirect logic can then
read from `sessionStorage` after sign-in. (See §8.2 step 3.)

**10.2  Stale "active" status for offline agents.** Today the agent list
shows every enrolled agent as "active" if it is not frozen, regardless of
whether the agent process is actually running. The redesign should surface a
"last seen" timestamp ("last active 3 minutes ago" vs. "just now") so the
operator can distinguish a frozen agent from a stopped agent from a
crashed agent.

**10.3  No real-time push (polling-only).** Today every screen polls every
2 seconds. For low scale this is fine. The redesign should be structured so
that swapping polling for server-sent events or websockets later is a
single backend-client change, not a frontend rewrite. Practically: isolate
data fetching into a small number of well-named hooks so a future SSE layer
can replace them.

**10.4  Onboarding is an overlay.** The current `PremiumSetupScreen` and
`SetupWizard` are two overlapping things. The redesign collapses them into
one full-screen wizard (§6.2) — never an overlay, never a modal.

**10.5  License surfaced during onboarding.** License is currently shown in
onboarding. The redesign hides it during onboarding and surfaces it only in
Settings (§6.11).

---

## 11. Open questions for the implementer

The implementer should resolve these in the first sprint. They are not
deal-breakers but the answers shape UX:

- **Inbox ordering** — newest first or oldest first? (Both have arguments:
  newest-first emphasizes the freshest item; oldest-first prevents
  starvation when the inbox fills up.)
- **Inbox badge behavior** — show count when 0? (Most apps hide the badge
  at 0; some show it greyed-out to indicate the surface exists.)
- **Inbox row urgency** — purely chronological, or weighted by amount / risk
  (payment > login > read)? (Weighing matches operator attention but adds
  bias.)
- **History filters** — chips vs. dropdown vs. segmented control?
- **Mobile nav** — drawer (hamburger) vs. bottom bar vs. collapsible sidebar?
- **Approval card collapse behavior on mobile** — keep detail visible
  alongside list on tablet widths, or always alternate full-screen?
- **Color signal for "frozen" vs. "active"** — what's the calm-but-clear
  treatment? (Per §2.5, never color-only — always pair with an icon or label.)

---

## 12. What success looks like

The redesign is done when:

1. **A first-time operator can go from "I just heard about this" to "my
   agent is connected and governed" without reading documentation.** The
   onboarding wizard covers it.
2. **A working operator with one agent and 30 minutes of history can find
   the one pending approval in under 3 seconds.** The inbox is the screen
   for that, and it must be fast and obvious.
3. **An operator who has been away for a week can tell from the Governance
   screen whether anything needs attention.** Empty inbox + green "all
   healthy" on each agent = nothing to do. One red primitive + a pending
   approval = something specific to look at.
4. **No cryptographic or protocol terminology leaks into the UI.** The
   customer reads "your rules" not "your mandate chain"; "paused" not
   "frozen"; "ask first" not "step-up threshold".
5. **The CLI login flow works on the first try.** The operator runs
   `agent-grid-mcp login`, the browser opens, they sign in, the token
   silently makes it back to the CLI, and they never see "what just
   happened" UI in the browser.
6. **Every screen has an honest empty state, loading state, and error state.**
   The operator never sees a blank page, a perpetual spinner, or a stack
   trace.

---

## Appendix A — Screen-to-API reference

Per the agreed scope: hints only, not full contracts. The backend wire
definitions live in `apps/approval-web/src/types.ts` and the relay code;
this appendix just maps each screen to what it needs.

| Screen | Read | Write |
|---|---|---|
| Sign-in / Sign-up | — (Clerk-hosted) | — |
| Onboarding step 1 | `GET /api/config` | `POST /api/config` |
| Onboarding step 2 | `GET /api/providers` | — |
| Onboarding step 3 | `GET /api/agents` (poll) | `POST /api/tokens` (one-time, manual toggle) |
| Governance | `GET /api/agents`, governance overview per agent | `POST /api/agents/{did}/freeze`, `…/unfreeze` |
| Per-agent governance detail | `GET /api/agents/{did}/governance/*`, mandates, policy, vault, cards, audit, identity, activity | `POST /api/mandates/{id}/revoke`, `POST /api/cards/{handle}/limits` |
| Dashboard | `GET /api/agents`, `GET /api/activity` | — |
| Inbox | `GET /api/approvals?status=pending` (poll) | `POST /api/approvals/{id}/decision` |
| History | `GET /api/approvals?status=resolved` (poll) | — |
| Create agent | — | `POST /api/tokens` |
| Providers | `GET /api/providers` | — |
| Devices | `GET /api/devices` | `DELETE /api/devices/{token}` |
| Settings | `GET /api/config`, `GET /api/license` | `POST /api/config`, `POST /api/license/activate`, `POST /api/license/deactivate` |

Global (every signed-in screen): the persistent poll loop for pending
approvals, history, agents, activity, and (slower) license status.

## Appendix B — Glossary (operator-facing terms → protocol terms)

| Operator-facing | Protocol term (do NOT show) |
|---|---|
| Agent | passport / agent DID |
| Your rules / the limits you set | mandate / mandate config |
| Ask me first / always ask | step-up threshold |
| The agent is paused | frozen |
| Decision needed | pending approval / STEP_UP verdict |
| Reason for the decision | rationale (request) / reason (decision) |
| The agent is acting within the rules | ALLOW verdict |
| Connected / working | enrolled + last-seen recent |
| Not configured | env var not set on host |
| Your sign-in session | Clerk JWT |
| The agent's connection to your account | `ag_` token |
