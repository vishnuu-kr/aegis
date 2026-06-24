# AgentGrid — Master Marketing & Go-To-Market Playbook

*Delegated agent identity control plane. Passport (identity) · Mandate (signed authority) · Policy Engine · Audit Ledger · five primitives (browser, email, phone/SMS, money, compute).*

**Prepared by:** Master Marketing Orchestrator & Strategy Director
**Market data:** Live 2026 competitive landscape (verified via web research)
**Contents:** 5-Department Strategy Teardown · /compare Pages · Show HN Launch Kit · Enterprise Outbound Engine

---

# PART I — FIVE-DEPARTMENT STRATEGY TEARDOWN

---

# 🏢 DEPARTMENT 1: STRATEGIC POSITIONING & COMPETITOR DEFENSE

## 📊 LIVE MARKET DIAGNOSIS

The "delegated agent identity" category is **already contested as of mid-2026** — AgentGrid is not entering an empty field, it is entering a knife fight.

**1. AliasKit (aliaskit.com) — the closest direct clone of your pitch.**
- *What it is:* "AI Agent Identity API — Email, Phone, Cards, DID, Verifiable Credentials" in a single API call. Free tier, no credit card. This is verbatim AgentGrid's thesis, already shipped as a hosted API.
- *Pricing gap:* Sells identities/cards/phone-lines as metered tiers. **No governance depth** — no attenuated mandate format, no hash-chained audit, no STEP_UP approval semantics. It's a provisioning API, not a control plane.
- *Weakness to exploit:* Hands you primitives but makes *you* build the policy, approval, and liability layer — exactly the 30% AgentGrid claims as novel.

**2. Anima (useanima.sh) — the enterprise-credible threat.**
- *What it is:* "Identity Infrastructure for AI Agents" — DKIM/SPF/DMARC mailboxes, US phone, real-time voice, Vaultwarden-based credential vault, server-side compliance gates (TCPA/DNC/RND), MCP server, CLI/SDK. Already SOC 2, OIDC/SAML SSO, EU region, Free/Growth/Enterprise pricing.
- *Weakness:* Vault + comms + phone solved, but delegation is "policy-driven identity," not a cryptographically signed, attenuable Mandate that assigns liability. Compliance gates are telephony-centric, not a general authority envelope. No on-device approval key model.

**3. tn8r (github.com/tn8r) — the open-source margin-killer.**
- *What it is:* OSS giving agents disposable email/phone/card via a 10-tool MCP server, BYOK (Cloudflare/Twilio/Lithic), TTL + spend limits, kill switch, a policy engine, SQLite logging.
- *Pricing gap = existential:* **Free and self-hostable**, already replicates AgentGrid's MCP surface, kill-switch, policy engine, audit-log primitives. Any paid pricing must justify itself against `git clone tn8r`.
- *Weakness:* Disposable identity — no persistent Passport, no DID anchoring, no hash-chained ledger, no human-signed Mandate. A dev toy; AgentGrid is the production governance layer.

**4. AgentWallet — "Principal for AI Agents" (agentwallet.ai).**
- *What it is:* Company (KYB) → Principal (KYC'd human, WebAuthn key) → Agent hierarchy, IntentMandates (vendor access, caps, geography, time bounds), WhatsApp approval. **AgentGrid's Mandate + Approval Loop, already named and shipped.**
- *Direct collision:* Your "Mandates" = their IntentMandate; STEP_UP-to-mobile = their WhatsApp approval. Cannot claim novel — must claim *better* (attenuation, JCS/RFC 8785 signing, hash-chained audit, the compute primitive).

**5. Permit.io MCP Gateway (Show HN, Mar 2026).**
- *What it is:* OPA/Zanzibar-style ReBAC authorization proxy between MCP clients and servers, sub-10ms policy eval, human-in-the-loop consent, delegation tracking, audit logging. Production at Tesla/Cisco/Intel.
- *Weakness:* Governs tool calls *inside MCP*; does **not** issue real-world email/phone/card/compute identity. The Policy Engine half with none of the five primitives. Complementary, but owns the "agent authorization" term and enterprise logos you want.

**6. Stripe (Issuing for Agents + Link wallet + MPP + x402 on Base).** The 800-lb gorilla on the money primitive: real-time authorization webhooks, single-use cards, Shared Payment Tokens, stablecoin support in 60+ countries, MPP for microtransactions. **You will never out-build Stripe on payments.** Treat as a *supplier*, not a competitor — but Stripe + AliasKit/Anima is the "good enough" stack you'll be compared against.

**Live developer sentiment (HN, Feb–May 2026):** Top threads — *"Don't trust AI agents,"* *"Hide Secrets from AI Agents using Airgap,"* AgentSecrets (zero-knowledge credential proxy), *"Show HN: OAuth for AI Agents"* — reveal the real buying emotion is **fear, not convenience**. The 30,000-user OpenClaw plaintext-credential incident is the sales catalyst. The category buyer is risk-driven, not capability-driven. Every competitor leads with capability. That's the gap.

## 🛠️ THE POSITIONING WEDGE

Do **not** position as "give your agent an identity/email/card" — that war is lost. Position on the axis nobody else can credibly claim: **provable, bounded, non-repudiable authority — the only agent identity layer where liability is assignable.**

1. **Reframe from "provisioning" to "governance."** *"AliasKit gives your agent a credit card. AgentGrid gives you a signed, revocable, court-admissible record of exactly what it was allowed to buy."* Sell the Mandate + hash-chained Audit Ledger; the five primitives are table stakes.
2. **Weaponize the liability story (Section 10).** No competitor leads with this. *"When your agent buys the wrong thing, who pays? With AgentGrid, the answer is provable."* The only defensible enterprise-procurement narrative in the category.
3. **Make "attenuation" the technical flex.** Child-scope-⊆-parent-scope attenuation with property-tested guarantees — a real differentiator for multi-agent/sub-agent architectures. Ship a live "watch a mandate attenuate across 3 sub-agents" demo.
4. **Own the fifth primitive — Compute.** None of the rivals give the agent the ability to build and host its own software. *"The only agent identity where the agent can ship and pay for its own production app, autonomously, inside a signed envelope."*
5. **Adopt open standards as a moat.** W3C DID, VC 2.0, RFC 9421 Web Bot Auth, AP2/x402, Cedar/OPA. *"Governed agent identity without a blockchain, without a token, without vendor lock-in"* — contrasts Agnic/Crossmint, removes the crypto-friction objection.

## ⚠️ CRITICAL POSITIONING VULNERABILITIES

1. **The "novel core" claim is already false in market.** AgentWallet, Permit.io, and Anima have shipped pieces of Passport/Mandate/Policy/Approval. *Correction:* drop "nobody has shipped this" immediately; compete on integration depth + non-repudiation rigor.
2. **The five-primitive bundle is a liability at first contact.** Reads as unfocused vs. AliasKit/Stripe/Permit. *Correction:* lead with **one wedge primitive + the governance layer** (Money + Mandate/Audit), reveal the other four as expansion. Sell a sharp spear, not a Swiss Army knife.
3. **"Autonomous by default" collides with the actual market emotion (fear).** *Correction:* invert — lead with **"human holds the pen,"** zero-trust by default. Autonomy is the benefit you unlock; control is what you sell.
4. **OSS (tn8r) sets the price anchor at $0.** *Correction:* never compete in the free/indie tier; price straight at the team/enterprise procurement buyer who needs SOC 2, signed audit trails, assignable liability. Cede the hobbyist to tn8r.

---

# 🔍 DEPARTMENT 2: SEMANTIC AUTHORITY & SEARCH INTENT ARCHITECTURE

## 📊 HIGH-INTENT KEYWORD MATRIX

The head term "AI agent identity" is contested by AliasKit, Anima, Agnic, WorkOS. The live BOFU intent lives in **fear + integration + comparison**. 10-node cluster, ranked by intent and winnability:

| # | BOFU Keyword Cluster | Intent | Why It Converts |
|---|---|---|---|
| 1 | give AI agent its own credit card with spending limits | Builder ready to ship | Fear-adjacent, your 5d+Mandate sweet spot |
| 2 | AI agent virtual card real-time authorization API | Evaluating Stripe vs. layer | Build-vs-buy buyer |
| 3 | how to stop AI agent from leaking API keys/credentials | Post-incident panic | Pure fear; Vault landing page |
| 4 | AI agent audit log compliance SOC2 | Enterprise procurement gate | Highest value; almost no competitor ranks |
| 5 | human in the loop approval for autonomous agent payments | Building approval gates | Maps to Approval Loop / STEP_UP |
| 6 | AgentWallet / AliasKit / Anima alternative | Active switchers | Capture competitor brand demand |
| 7 | let AI agent sign up for SaaS autonomously email OTP | Builder hitting verification wall | Inbounter/inkbox rank — beatable with depth |
| 8 | scoped delegated credentials for AI agents | Security engineer | Technical buyer, high LTV |
| 9 | AP2 vs x402 vs MPP which payment protocol for agents | Protocol-decision stage | Positions you as neutral integrator |
| 10 | revoke AI agent access kill switch | Risk/ops owner | Fear term; demonstrates control |

Prioritize nodes 3, 4, 5, 6, 10 — fear/compliance/switcher cluster where budget and weak competitor coverage intersect.

## 🛠️ PROGRAMMATIC SEO & DISCOVERY STRATEGY

**Axis 1 — `/agents/sign-up-for/{service-slug}`** (the "agent can sign up for X" matrix). Each page: can an AgentGrid agent autonomously create an account here, which primitives it uses, ToS/agent-permission status, copy-paste MCP/SDK snippet, live demo. Seed from top 500 SaaS signup flows. Out-flanks Inbounter/inkbox-kernel.

**Axis 2 — `/compare/{competitor}`** (switcher capture): aliaskit, anima, agentwallet, tn8r, stripe-issuing. Honest feature matrices, no FUD.

**Axis 3 — `/protocols/{standard}`** (semantic authority): ap2, x402, did, rfc-9421-web-bot-auth, w3c-vc, mpp. Engineer-grade explainers with AgentGrid's implementation shown.

**Schema requirements:** `SoftwareApplication` + `Offer` (product/pricing); `TechArticle` + `HowTo`/`HowToStep` (integration/protocol pages); `FAQPage` (every BOFU page); `BreadcrumbList`; `Organization` + `sameAs` (GitHub/npm/docs).

**URL architecture:** flat, semantic, lowercase-hyphenated `agentgrid.dev/{cluster}/{slug}`. Canonicalize aggressively; `noindex` thin pages until they earn a working demo. Segmented XML sitemap index per axis.

## ⚠️ AI ENGINE OPTIMIZATION (AEO) FLAWS

1. **Codename opacity.** "Passport/Mandate/AgentGrid" have zero semantic anchoring to real queries. *Fix:* every page carries an extraction-ready definition: *"AgentGrid is a control plane that gives an AI agent its own governed identity (the 'Passport') with cryptographically-signed human authority grants (the 'Mandate')."*
2. **No atomic Q&A blocks.** LLMs cite self-contained question→answer pairs, not flowing prose. *Fix:* convert each constraint into an H2 phrased as the literal user question, followed by a ≤3-sentence direct answer before elaboration.
3. **Claims without extractable proof structure.** *Fix:* comparison tables, numbered steps, bolded **claim → mechanism → guarantee** triples. Add an `llms.txt` at root summarizing entity, primitives, standards.

---

# 📈 DEPARTMENT 3: HIGH-SIGNAL COLD OUTREACH & SDR AUTOMATION

## 📊 IDEAL BUYER PSYCHOGRAPHIC PROFILE

**Primary persona: the "Agent Platform Owner."** Staff/Principal Engineer, Head of AI/Agent Platform, or technical co-founder at a Series A–C company *shipping autonomous agents into production*. Already using LangChain/LangGraph, MCP, Claude Code, or a homegrown harness. Agents need to log into third-party services; currently using **shared human credentials in env vars** — and they know it's a time bomb.

**Trigger event:** a near-miss or actual incident (leaked key, runaway bill, prompt injection). The OpenClaw 30k-credential incident is the archetype. They're not browsing; they're bleeding.

**Silent objections:**
- *"I can build this with Stripe Issuing + a Vault + 200 lines of glue."* → Answer with attenuation correctness, hash-chained non-repudiation, SOC 2-ready audit, the compute primitive.
- *"New vendor in my critical auth path = new attack surface/SPOF."* → Self-host/VPC, local-first vault (age/sops), agent never sees raw secrets.
- *"Security team will veto a startup holding our delegation keys."* → On-device key model (human's signing key lives in their app), open-standards/no-lock-in.

**Procurement barriers:** SOC 2 Type II (gate #1 — Anima already has it), security questionnaire/DPA, data-residency (EU region).

**Metrics they must hit:** zero credential-in-env-var findings next audit; provable audit trail for every agent financial action; reduced eng time on homegrown agent-auth glue (~1 FTE-quarter).

## 🛠️ THE 3-STEP HIGH-CONVERSION EMAIL SEQUENCE

Plain-text, no images/pixels, single soft CTA each. Written for an engineer, not a procurement bot.

**Email 1 — Day 0 — Bottleneck identification.**
> **Subject:** your agents are logging in as you
>
> {{first_name}} — saw {{company}} shipped {{specific_agent_product_or_repo}}. Quick question: when those agents sign up for or log into third-party services, whose credentials are they using?
>
> If the answer is "a shared key in an env var" (it usually is), you know the failure modes — can't scope it, can't revoke it without rotating *your* key, and the audit log says *you* did it.
>
> We built the alternative: each agent gets its own identity — keypair, email, phone, virtual card — and you sign scoped grants ("this agent, this much, until Friday"). The agent never sees a raw secret.
>
> Worth a 15-min technical walkthrough? I'll show the attenuation + audit model, not a slide deck. — {{sender}}

**Email 2 — Day 3 — Proof footprint.**
> **Subject:** re: the "I'll just use Stripe Issuing" question
>
> Most teams say "I can build this with Stripe Issuing + a vault." True for the card. The part that takes a quarter: a cryptographically-signed grant where a sub-agent's authority is provably ⊆ its parent's, plus a hash-chained ledger where every action traces back to a human pre-authorization.
>
> That's the difference between "the agent spent money" and "here is the signed mandate that authorized it" when finance/legal asks.
>
> Two-minute proof: [link to live attenuation demo / GitHub]. No signup wall. Want the SOC 2 report and self-host docs? Reply "send."

**Email 3 — Day 7 — Breakup + compute hook.**
> **Subject:** closing the loop
>
> Last note, {{first_name}}. If agent identity isn't a Q3 priority, no worries — I'll get out of your inbox.
>
> One thing most teams miss until they hit it: governed identity isn't just for spending. With a real card + cloud-provisioning grant, an agent can build, deploy, and pay for its own service end-to-end inside a signed envelope you control. When you get to autonomous deploys, that's the wall.
>
> If/when that's live for you: {{calendar_link}}. Otherwise I'll close this out — good luck with {{specific_agent_product}}.

## ⚠️ COLD OUTREACH FRICTION AUDIT

1. **Capability-led subject lines** pattern-match to spam. *Re-engineered hook:* lead with the vulnerability they feel ("your agents are logging in as you").
2. **Bundled feature-dump** trips BS detectors + length heuristics. *Fix:* one pain, one primitive, one proof per email.
3. **Image/pixel-heavy HTML** tanks deliverability to engineers. *Fix:* plain text, one link, no pixel, warmed subdomain (SPF/DKIM/DMARC aligned).
4. **"Quick call?" + Calendly in email 1** = instant delete. *Fix:* calendar link only in email 3, after two proof footprints.
5. **Claiming "nobody has built this."** *Fix:* acknowledge the category openly; differentiate on depth. Honesty is a trust signal.

---

# ⚡ DEPARTMENT 4: PRODUCT-LED GROWTH (PLG) & IN-APP ACQUISITION LOOPS

## 📊 THE "TIME-TO-AHA!" USER JOURNEY

The aha: **watching an agent complete a real-world action that required identity, while you hold a signed, revocable record of it.** Under 5 minutes, terminal-first.

1. **Landing page → `npx agentgrid init`** (zero signup). Provisions a sandboxed Passport with mock primitives — no KYC, no card, no wait. Remove every gate before the aha (tn8r already does free local mock providers — match it).
2. **Issue a Mandate:** `agentgrid mandate create --spend '$5/mo' --signup notion.com --ttl 7d`. CLI prints signed mandate JSON. *Aha #1: "I can read exactly what I authorized."*
3. **Connect to Claude Code / any MCP client.** Task the agent: "sign up for {test service}." Agent uses its own email, captures the OTP, completes signup. *Core aha — minute 3.*
4. **`agentgrid audit tail`** streams the hash-chained ledger live. *Aha #2: "I have a provable receipt." Converts the fear-driven buyer.*
5. **`agentgrid revoke`** — instant kill switch mid-task. *Aha #3: "I'm in control." Emotional close.*

Ordered **autonomy → audit → revocation** to neutralize the "don't trust AI agents" reflex.

## 🛠️ VIRAL MECHANICAL ENGINE

1. **Signed-action public receipts (core loop).** Optional public verifiable receipt page (`agentgrid.dev/r/{hash}`): "Agent {id}, operated by {handle}, completed {action} under signed Mandate {ref}." Builders sharing "my agent autonomously deployed and paid for its own app — here's the cryptographic proof" is the viral artifact. Turns the audit ledger into the growth engine — uniquely yours.
2. **Agent-built apps carry attribution (primitive 5e).** Deployed app footer/`.well-known` carries a verifiable "Identity by AgentGrid" badge with the RFC 9421 credential. Every autonomously-shipped app is a billboard. No provisioning competitor has this.
3. **The `.well-known` key-directory network effect.** As more sites adopt Web Bot Auth to welcome accountable agents, AgentGrid-signed agents get let in — supply-side flywheel.
4. **Mandate templates as shareable OSS artifacts.** Public gallery of signed-mandate templates devs fork; each fork seeds a new account. Matches r/LocalLLaMA "plan-first, scoped execution" culture.

## ⚠️ CHURN RISK DETECTION

**Highest friction = the gap between the sandbox aha and real-world activation: the KYC wall.** A human must complete Stripe/Lithic KYC to fund a real card — a multi-day, document-heavy, possibly-rejected process dropped right after the dopamine hit. The day-1-to-14 churn cliff.

**Secondary friction:** the first signed Mandate is conceptually heavy (Passport vs. Mandate vs. Policy vs. attenuation). tn8r's "one command" feels lighter.

**Automated onboarding fix:**
1. **Decouple value from KYC.** Let agents operate fully on mock/sandbox primitives indefinitely; KYC becomes a late, well-timed upgrade prompted only at first real-money action. Never gate the aha behind KYC.
2. **Progressive KYC with status transparency.** On upgrade: instant confirmation → hosted status page with ETA → automated nudge if docs stall → "your agent is live, here's a $5 test mandate" activation email on clear.
3. **One-line "smart mandate" default.** `agentgrid quickstart` auto-generates a conservative default Mandate (low cap, short TTL, STEP_UP on irreversible). Sane defaults beat education for activation. Add a "test mandate expires in 2 days" re-engagement trigger before the 14-day cliff.

---

# 🚀 DEPARTMENT 5: DISTRIBUTION CHANNELS & VIRAL LAUNCH TIMELINE

## 📊 CHANNEL ATTACK VECTOR

**1. Hacker News — primary.** Verifiably where the conversation lives (Don't trust AI agents; Airgap secrets; AgentSecrets; OAuth for AI Agents; Permit MCP Gateway). High-performing format: "Show HN" with a working OSS core + brutally honest writeup that names residual risks (your Section 9 honesty is gold). HN rewards honesty, punishes marketing.

**2. r/LocalLLaMA + r/LangChain + LangChain Slack/Forum — builder core.** Live 2026 threads value "plan-first files, scoped execution, approval gates" — AgentGrid's model in the community's own words. Format: technical deep-dives and build logs, NOT product announcements (removed on sight). Contribute the *pattern*; mention the tool secondarily.

**3. MCP / Claude Code developer circle (MCP registries, GitHub ecosystem, Anthropic Discord, X agent-builder accounts).** Permit.io, AgentAuth, tn8r all distribute as MCP servers. Format: ship as a first-class MCP server, get into directories, post "give your Claude Code agent its own governed card in 3 commands" terminal recordings. Asciinema is the native viral unit.

## 🛠️ THE 7-DAY PRODUCT HUNT & SHOW HN BLUEPRINT

**T-5:** Open-source the core (Mandate format, Policy Engine, audit verifier). Seed README with live attenuation demo. Soft-share in 2–3 LangChain/MCP Slack channels — no pitch.

**T-2:** Pre-record 60–90s terminal-cast (init → mandate create → signup → audit tail → revoke). Prepare HN writeup with residual-risk section. Line up hunter + ~10 genuine users for substantive comments.

**Day 1 — dual launch:** Show HN at ~7:00–8:30am ET; PH at 12:01am PT.
- **Show HN title:** `Show HN: AgentGrid – give an AI agent its own identity, card, and a signed audit trail`
- **PH title:** `AgentGrid — your AI agent's own credentials, with a receipt for everything it does`
- **PH tagline:** `Scoped credentials, real-time approval, and a tamper-proof audit log for autonomous agents.`

**Asset timing (Day 1):** terminal-cast in first comment (HN strips it from body). Post deep-dive/threat-model link as a reply 2–3h in when traction builds. Drop the build-vs-buy table only when asked "why not Stripe Issuing."

**Days 2–4:** Engage every comment within ~15 min for the first 6 hours (velocity-driven ranking). Publish the deep-dive to r/LocalLLaMA / r/LangChain as a *pattern* post. Post MCP demo to Claude Code circles.

**Days 5–7:** Ship `/compare/{competitor}` pages so brand searches land on switcher content. Follow up email captures. Submit to MCP directories. Recap thread ("launch in numbers + what we're fixing").

## ⚠️ COMMUNITY MARKETING RED FLAGS

1. **Pure product announcements in r/LocalLLaMA / r/LangChain = instant removal.** *Alt:* lead with OSS pattern + technical writeup useful even to non-buyers.
2. **Astroturfed PH comments** get penalized. *Alt:* coach seed users to post real, specific feedback including critique.
3. **False novelty / hiding competitors** gets you ratio'd. *Alt:* open with honest category framing.
4. **Hiding residual risks** gets you dismantled by HN security crowd. *Alt:* publish the threat model and honest limits up front — highest-trust move available.
5. **Detection-evasion messaging** flags you as malware-adjacent. *Alt:* position on RFC 9421 signed-agent identity, respecting robots.txt — the accountable agent sites *welcome*.

---

# PART II — `/compare/{competitor}` PAGE COPY

Skeleton per page: honest hero → "when to pick them" → "where AgentGrid wins" → feature matrix → migration CTA. URL: `agentgrid.dev/compare/{slug}`.

## /compare/aliaskit

**H1:** AgentGrid vs. AliasKit
**Subhead:** AliasKit gives your agent an inbox, a phone, and a card in one API call. AgentGrid adds the layer that makes those actions provable, scoped, and revocable — a signed authority envelope and a tamper-evident audit trail.

**When AliasKit is right.** Need to provision a disposable agent identity (email + phone + card) behind one API call and handle authorization/audit yourself? AliasKit is fast and clean. Free tier, ship in an afternoon.

**Where AgentGrid wins.**
- Signed, attenuable Mandates, not flat provisioning (issues *authority*, not just credentials; sub-agent authority provably ⊆ parent's).
- Hash-chained audit ledger — every action chains to the Mandate that authorized it.
- The compute primitive — agents provision, deploy, and pay for their own software.
- Liability is assignable — signed Mandate (pre-auth) + ledger (receipt).

| | AliasKit | AgentGrid |
|---|---|---|
| Agent email / phone / virtual card | ✅ | ✅ |
| W3C DID + Verifiable Credentials | ✅ | ✅ |
| Single-API provisioning | ✅ | ✅ |
| Signed authority grants (Mandate) | ❌ | ✅ |
| Mandate attenuation (child ⊆ parent) | ❌ | ✅ |
| Hash-chained audit ledger | ❌ | ✅ |
| Real-time human approval (STEP_UP) | ❌ | ✅ |
| Compute primitive | ❌ | ✅ |
| Self-host / local-first vault | ❌ | ✅ |
| MCP server surface | ✅ | ✅ |

**CTA:** *Already using AliasKit? Keep your provisioning, add the governance layer. → Get an API key (no signup wall)*

## /compare/anima

**H1:** AgentGrid vs. Anima
**Subhead:** Anima is mature identity infrastructure — compliant mailboxes, US phone, voice, a credential vault, SOC 2. AgentGrid is the governance and accountability layer: signed authority you can scope, revoke, and prove.

**When Anima is right.** Primary need is telephony-grade agent identity (compliant mailboxes, real-time voice, TCPA/DNC/RND gates)? Anima is the most mature in that lane, SOC 2 and EU region shipped.

**Where AgentGrid wins.**
- Authority, not just identity + a vault (human-authored signed Mandates with non-repudiation).
- Attenuation for multi-agent systems (provable subset across agent trees).
- Hash-chained audit vs. logs — built for the SOC 2 *evidence* requirement.
- The compute primitive — governed self-hosting agents.

| | Anima | AgentGrid |
|---|---|---|
| Compliant email (DKIM/SPF/DMARC) | ✅ | ✅ |
| US phone, SMS, voice calls | ✅ | ⚠️ SMS/voice via Twilio; voice not core |
| Credential vault | ✅ (Vaultwarden) | ✅ (Vault / KMS / local age+sops) |
| SOC 2, OIDC/SAML SSO, EU region | ✅ | 🔜 roadmap |
| Telephony compliance gates | ✅ | ❌ |
| Cryptographically-signed Mandates | ❌ | ✅ |
| Mandate attenuation | ❌ | ✅ |
| Hash-chained audit ledger | ⚠️ logs | ✅ signed + chained |
| Compute primitive | ❌ | ✅ |
| No-blockchain, open-standards | ✅ | ✅ |

**Honest note:** Anima is ahead on SOC 2 and voice today. If those are hard gates now, talk to them. If your gate is provable, scoped authority and audit, that's our core.

**CTA:** *Need governance on top of identity infra? → See the Mandate + audit model*

## /compare/agentwallet

**H1:** AgentGrid vs. AgentWallet (Principal)
**Subhead:** AgentWallet ties every agent to a KYC'd human Principal with IntentMandates and WhatsApp approval. AgentGrid shares the model — and goes deeper on cryptographic rigor, attenuation, the audit ledger, and the compute primitive.

**When AgentWallet is right.** Want a clean Company (KYB) → Principal (KYC'd human) → Agent hierarchy with WebAuthn principals and lightweight WhatsApp approval? AgentWallet ships that today.

**Where AgentGrid wins** (depth, not category):
- Attenuation as a tested guarantee (property-tested child ⊆ parent across trees).
- Canonical signing (RFC 8785) + offline-verifiable hash-chained ledger.
- The fifth primitive — compute (agent builds, deploys, pays for its own service).
- Self-host / local-first on-device signing keys.

| | AgentWallet | AgentGrid |
|---|---|---|
| Human Principal → Agent hierarchy | ✅ | ✅ |
| Signed authority grants | ✅ IntentMandate | ✅ Mandate |
| Mobile/chat approval | ✅ WhatsApp | ✅ on-device RN app (STEP_UP) |
| Attenuation, property-tested | ⚠️ caps only | ✅ |
| Canonical (RFC 8785) signing | ❌ | ✅ |
| Hash-chained, offline-verifiable audit | ⚠️ | ✅ |
| Agent email / phone / card | ✅ | ✅ |
| Compute primitive | ❌ | ✅ |
| Self-host / local-first keys | ❌ | ✅ |

**CTA:** *Evaluating both? Run our attenuation + audit-verifier demo — the part that's hard to build. → Live demo*

## /compare/tn8r

**H1:** AgentGrid vs. tn8r (open source)
**Subhead:** tn8r is a great free, self-hostable way to give an agent disposable credentials. AgentGrid is what you reach for when "disposable" becomes "production."

**When tn8r is right.** Honestly, often when starting out. OSS, free mock providers, disposable email/phone/card via a 10-tool MCP server with BYOK, kill switch, policy engine, SQLite logging. For solo builders and prototypes, `git clone tn8r` is the right move.

**Where AgentGrid wins (when you outgrow disposable).**
- Persistent DID-anchored Passport, not throwaway identity.
- Cryptographic non-repudiation (signed + hash-chained vs. SQLite log).
- Human-signed Mandates with attenuation.
- SOC 2 path, DPA, EU region, support.

| | tn8r (OSS) | AgentGrid |
|---|---|---|
| Price | Free / self-host | Paid (team/enterprise) |
| Agent email / phone / card | ✅ | ✅ |
| MCP server + kill switch | ✅ | ✅ |
| Policy engine | ✅ | ✅ (Cedar/OPA) |
| Persistent DID-anchored identity | ❌ disposable | ✅ |
| Human-signed Mandates + attenuation | ❌ | ✅ |
| Hash-chained signed audit ledger | ⚠️ SQLite log | ✅ |
| Compute primitive | ❌ | ✅ |
| SOC 2 / DPA / EU region / SLA | ❌ DIY | 🔜 / ✅ |

**CTA:** *Outgrowing disposable identities? Migrate your tn8r MCP setup to a governed control plane. → Migration guide*

## /compare/stripe-issuing

**H1:** AgentGrid vs. building on Stripe Issuing yourself
**Subhead:** Stripe Issuing is the best card-issuing rail on earth, and AgentGrid runs on it. The question is whether you build the identity, authority, audit, and approval layer on top of Stripe yourself, or use the one we already built.

**When raw Stripe Issuing is right.** Just need virtual cards with spend controls + real-time auth webhooks, no agent email/phone/identity or signed audit trail? Go straight to Stripe Issuing / Link wallet / MPP.

**Where AgentGrid wins (the part you'd otherwise build).** Stripe gives the money primitive; a production agent needs four more (email, phone, browser, compute) + the governance tying them together: one identity across all five; signed Mandates authorizing spend *and* signups *and* deploys; hash-chained audit across every action; attenuation + on-device approval. We feed Stripe's real-time auth webhook with Mandate/policy context.

| | Stripe Issuing (raw) | AgentGrid (on Stripe) |
|---|---|---|
| Virtual cards + spend controls | ✅ | ✅ (via Stripe/Lithic) |
| Real-time authorization webhook | ✅ | ✅ + Mandate/policy context |
| Agent email / phone / browser / compute | ❌ | ✅ |
| Signed authority across all actions | ❌ card-only | ✅ |
| Hash-chained audit (all actions) | ⚠️ card txns | ✅ |
| Attenuation + sub-agent authority | ❌ | ✅ |
| On-device human approval (STEP_UP) | ❌ | ✅ |
| Build-time saved | — | ~1 FTE-quarter of glue |

**CTA:** *Already on Stripe Issuing? Keep it. Add the four other primitives + governance. → See the integration*

---

# PART III — SHOW HN LAUNCH KIT

## The post

**Title:** `Show HN: AgentGrid – give an AI agent its own identity, card, and a signed audit trail`
**URL field:** the GitHub repo (open-source core), not a landing page.

## Maker's first comment

> Hi HN. I'm {{name}}, I built AgentGrid.
>
> Every "give your agent access to things" tool I tried made the same mistake: it handed the agent **my** credentials. The agent logs in as me. That fails three ways at once — I can't scope it, I can't revoke it without rotating my own password, and the audit log says *I* did it.
>
> AgentGrid is built on the opposite primitive: delegation. The agent gets its **own** identity — a keypair (W3C DID), its own email, phone number, virtual card, and cloud account. I don't lend it my passport; I sign scoped grants ("Mandates"): "this agent, $5/mo, may sign up for Notion, expires Friday, human-approval required on anything irreversible."
>
> Two things I think are actually new vs. the provisioning tools (AliasKit, Anima, tn8r) and the Principal/IntentMandate model (AgentWallet):
> 1. **Attenuation as a tested guarantee** — a sub-agent's authority is provably a subset of its parent's. Property tests fail the build if a child scope ever exceeds its parent.
> 2. **A hash-chained, signed audit ledger** — every action chains back to the Mandate that authorized it. When finance asks "who authorized this $40 charge," there's a cryptographic answer, offline-verifiable. The signed Mandate is the pre-authorization; the ledger is the receipt. Together they make liability *assignable*.
>
> The "you can't MCP every website" problem isn't a blocker: a human doesn't have an integration with every website either. A human brings five general-purpose primitives — browser, email, phone, money, and (for builders) a hosting account — and operates any site that exists. Give the agent delegated, governed versions and it has universal access by construction.
>
> The Mandate format, policy engine (Cedar), and audit verifier are open source: {{repo link}}. It's an MCP server, so it works with Claude Code today. TypeScript, Ed25519 via @noble, RFC 8785 canonical signing, Stripe Issuing/Lithic for cards.
>
> **Honest about the limits:**
> - It can't make an agent pass KYC. Humans do KYC once at setup; the agent operates within the virtual cards hanging off that human-verified root. No legal personhood, and we don't pretend otherwise.
> - Agent-created accounts on hostile sites can be banned. We respect robots.txt and rate limits, don't build detection-evasion, and scope which services the agent may sign up for.
> - Prompt injection is mitigated, not solved — the agent is treated as untrusted; authority lives in signed Mandates it can't forge; irreversible actions require human STEP_UP. A clever injection inside the granted envelope is a residual risk.
>
> What would you stress-test first? The attenuation model and the prompt-injection threat model are the two I'd most want this crowd to break.

## First-10-replies scripts

**1. "Why not just Stripe Issuing + a vault + 200 lines of glue?"**
> You can, and for card-only spend with no other primitives, you probably should — we run *on* Stripe Issuing. The 200 lines becomes a quarter once you need deterministic canonical signing so Mandates verify offline, attenuation that's property-tested across sub-agents, a hash-chained ledger that survives a dispute, plus the other four primitives under one identity. We're the glue, hardened, with the parts that are easy to get subtly wrong.

**2. "This is just AliasKit / Anima / AgentWallet with extra steps."**
> Fair. AliasKit and Anima provision identity — we add the signed-authority + audit layer they leave to you. AgentWallet is closest: Principal→IntentMandate→approval is genuinely similar. We go deeper on attenuation (tested child ⊆ parent), RFC 8785 signing, an offline-verifiable hash-chained ledger, and a fifth primitive none have: the agent provisioning and paying for its own compute. Not claiming we invented the category — the most rigorous integration of it.

**3. "Prompt injection makes this pointless — the agent will be tricked into signing a bad Mandate."**
> The agent never *signs* Mandates — the human does, on a separate trusted device with an on-device key. The agent can only *act within* Mandates it can't forge or escalate. An injection can make it misbehave inside its envelope (real risk), but it can't grant itself new authority, exceed a cap, or skip STEP_UP on irreversible actions. Blast radius is bounded by the envelope, not by the agent's good behavior.

**4. "Letting an AI agent have a credit card is insane."**
> Same way you sleep with an employee who has a company card: hard caps at the card network, short-TTL Mandate, STEP_UP on new payees and irreversible actions, and a signed receipt for every charge. The network-level limit is the backstop even if everything above fails. Deliberately "as capable as a junior assistant with a scoped card" — and no more.

**5. "ToS violation — most sites ban non-human accounts."**
> Real wall, which is why we don't fight it dishonestly. No detection-evasion. We scope which services an agent may sign up for (allowlist), prefer sites with APIs or agent-permission signals, and implement RFC 9421 Web Bot Auth so sites can permit *accountable* agents. Near-term, some accounts get banned and we say so up front.

**6. "Who's liable when the agent buys the wrong thing?"**
> Legally unsettled in 2026; we don't make it disappear — we make it bounded and provable. Signed Mandate = documented pre-authorization; hash-chained ledger = exact record. Liability becomes assignable and defensible. Combine with conservative defaults and hard caps. The human/org is always the accountable principal — the only defensible posture.

**7. "Why off-chain? Agnic.ID does this with ERC-8004 on Base."**
> Deliberate. Our buyers are platform/security engineers; "you need a blockchain and a token to give your agent a card" is a non-starter for procurement. Same open standards (W3C DID, VC 2.0) off-chain — no chain, no token, no lock-in. On-chain is legitimate; just not what enterprise procurement signs.

**8. "I'm not letting a startup hold my delegation keys."**
> The human's signing key lives on-device in the approval app, never on our servers — we can't sign Mandates for you even if we wanted to. Vault has a local-first mode (age/sops + OS keychain master key), and the whole control plane self-hosts. Hosted is convenience, not a requirement.

**9. "How is this different from Permit.io's MCP gateway?"**
> Permit governs tool calls *inside MCP* — the policy/consent/audit half. It doesn't give the agent a real-world identity (email/phone/card/compute) to act *outside* MCP. Complementary: Permit governs what the agent's tools can do; AgentGrid gives the agent the identity and primitives to exist on the open internet, governed. Run both.

**10. "Show me the audit verifier works / where's the code?"**
> Repo: {{link}}. `packages/audit` has the hash-chained ledger + an offline `verify` you can run against a sample ledger without touching our servers — tamper one record and verification fails. `packages/policy` has the Cedar policies + property tests for attenuation. Would value eyes on the RFC 8785 canonicalization edge cases — that's where subtle signing bugs hide.

---

# PART IV — ENTERPRISE OUTBOUND ENGINE (SOC2-GATED)

*Targeting blueprint + qualification filters + enriched sequence. Point a data tool (Apollo/Clay/Apify) at this to execute against live contacts.*

## ICP definition

**Company filters:** Series A–C; 50–500 headcount; AI-native SaaS / dev tools / agent platforms / vertical AI / RPA-replacement. **Technographic qualifier:** shipping autonomous agents in production (public GitHub using LangChain/LangGraph/CrewAI/MCP; job posts mentioning "AI agents in production"; product taking autonomous actions).

**Disqualifiers:** pre-seed/solo (cede to tn8r); research-only (too early); already deep on Anima/AgentWallet with no pain signal (re-target on trigger only).

## Trigger events (cold → hot)

1. Public security incident (leaked key, runaway bill, prompt-injection writeup; OpenClaw archetype).
2. Job posting for Agent Platform / AI Security / Agent Infrastructure Engineer.
3. GitHub commit wiring agents to third-party logins with credentials in env.
4. Funding round (fresh budget + scaling).
5. Conference talk / blog post on agent architecture mentioning auth/credentials/safety pain.

## Buyer map (priority order)

| Priority | Title | Why | Opening angle |
|---|---|---|---|
| 1 | Head of AI / Agent Platform | Owns problem + budget | Bottleneck (credentials in env) |
| 2 | Staff/Principal Eng (agent infra) | Technical evaluator/champion | Build-vs-buy + attenuation rigor |
| 3 | CISO / Head of Security | Owns the fear + SOC 2 gate | Audit trail + zero-trust + liability |
| 4 | VP Eng / CTO (smaller cos) | Final sign-off | FTE-quarter saved + compliance |

## Enriched 4-touch enterprise sequence

**Touch 1 — Day 0 — Platform/Staff Eng (technical bottleneck).**
> **Subject:** how {{company}}'s agents authenticate to third-party services
>
> {{first_name}} — saw {{trigger: agent-platform job post / repo / launch}}. When those agents sign up for or log into outside services in prod, whose credentials are they using?
>
> If it's a shared key in an env var, you know the failure modes — unscopable, unrevokable without rotating your own key, audit log names *you*.
>
> We give each agent its own identity (keypair, email, phone, virtual card) and let you sign scoped grants — "this agent, $X/mo, until Friday, human-approval on anything irreversible." Agent never sees a raw secret. Open-source core + offline-verifiable audit: {{repo}}.
>
> Worth 15 min on the attenuation + audit model? — {{sender}}

**Touch 2 — Day 4 — CISO/Security (fear + compliance, in parallel).**
> **Subject:** provable authority for {{company}}'s production agents
>
> {{first_name}} — your team is shipping autonomous agents. The question your next audit will ask: for every action an agent took, can you prove a human authorized it, within what limits, and produce a tamper-evident record?
>
> AgentGrid makes that the architecture: human-signed Mandates (pre-authorization) + a hash-chained ledger (receipt). Liability becomes assignable and defensible. Agents never hold raw secrets; irreversible actions require on-device human approval.
>
> Happy to send our security model + self-host docs (the human's signing key never touches our servers). Reply "send."

**Touch 3 — Day 8 — proof footprint.**
> **Subject:** the part that takes a quarter to build right
>
> The card is easy — Stripe Issuing under the hood. The part teams underestimate: a signed grant where a sub-agent's authority is provably ⊆ its parent's, plus a ledger that holds up when finance/legal asks "who authorized this."
>
> 2-min proof, no signup: {{attenuation + audit-verifier demo}}. Tamper one ledger record and verification fails — that's the point.
>
> If SOC 2 is a gate, let's talk timeline — happy to share where we are and our roadmap.

**Touch 4 — Day 14 — multi-thread close + compute hook.**
> **Subject:** closing the loop on agent identity at {{company}}
>
> Last note, {{first_name}}. If governed agent identity isn't this quarter's priority, I'll step back.
>
> One thing teams hit later: this isn't just about spend. With a card + cloud-provisioning grant, an agent can build, deploy, and pay for its own service end-to-end inside an envelope you control and can audit. That's usually where homegrown glue breaks.
>
> Whenever it's live for you: {{calendar}}. Otherwise I'll close this out — good luck with {{their agent product}}.

## Deliverability + ops rules

- Send from a warmed subdomain (`mail.agentgrid.dev`), SPF/DKIM/DMARC aligned. Plain text, one link max, no tracking pixel.
- Multi-thread Eng + Security in parallel (touches 1 & 2), don't sequence — enterprise needs champion + security sign-off.
- Cap ~30–50 sends/day/mailbox; rotate mailboxes for volume. Personalize the `{{trigger}}` line manually.
- Every email passes the "would a Staff Engineer respect this?" test before sending.

---

*End of master playbook. Sources: live 2026 web research (HN, Reddit, vendor sites: AliasKit, Anima, tn8r, AgentWallet, Agnic.ID, Permit.io, Stripe, Crossmint, WorkOS, KnowYourAgent) + the AgentGrid build blueprint.*
