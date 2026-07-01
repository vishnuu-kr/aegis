import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

// ── Data ────────────────────────────────────────────────────────────────────
type FaqItem = {
  q: string
  a: string
  cat: string
  readMin: number
  tags: string[]
  updatedRel: string
  helpful: number
}

const faqItems: FaqItem[] = [
  {
    cat: "fundamentals", q: "What exactly is an agent passport?",
    a: "An agent passport is the agent's own cryptographic identity — an Ed25519 keypair bound to a W3C DID. It signs requests and audit entries so permissions can be scoped and revoked cleanly, and so every action is attributable to a specific agent rather than to whoever has your API key.",
    readMin: 4, tags: ["identity", "Ed25519", "DID"], updatedRel: "Updated 2 days ago", helpful: 142,
  },
  {
    cat: "fundamentals", q: "How is this different from giving an agent my API keys?",
    a: "API keys give broad access to whoever has them. AgentTag gives each agent a separate identity with narrow, policy-based permissions — spend caps, allowed tools, expiring scopes — and a signed audit trail you can verify after the fact.",
    readMin: 3, tags: ["security", "comparison"], updatedRel: "Updated 1 week ago", helpful: 98,
  },
  {
    cat: "fundamentals", q: "What does \u201cgoverned by mandates\u201d mean in practice?",
    a: "Mandates are signed policy documents that define what an agent can do, how much it can spend, when it must ask for human approval, and when access expires. They're version-controlled, revocable, and evaluated at request time by the policy engine.",
    readMin: 5, tags: ["policy", "mandates"], updatedRel: "Updated 3 days ago", helpful: 87,
  },
  {
    cat: "getting-started", q: "How do I install AgentTag for the first time?",
    a: "Run `agenttag mcp add --client claude` to mint a passport and register your first mandate. The CLI walks you through the rest, and you can finish setup from the Setup & CLI tab in the control plane.",
    readMin: 2, tags: ["cli", "install", "setup"], updatedRel: "Updated yesterday", helpful: 213,
  },
  {
    cat: "getting-started", q: "Do I need to replace my existing MCP clients?",
    a: "No. AgentTag sits in front of your existing MCP servers as a policy surface — your Claude Desktop, CrewAI, or LangChain clients keep working unchanged, but every request now flows through signed mandates first.",
    readMin: 3, tags: ["mcp", "integration"], updatedRel: "Updated 5 days ago", helpful: 156,
  },
  {
    cat: "integrations", q: "Which clients and tools does it work with?",
    a: "Any MCP-compatible client or A2A-style agent runtime. We ship tested integrations for Claude Desktop, CrewAI, LangChain, and a generic MCP wrapper for custom stacks.",
    readMin: 2, tags: ["mcp", "a2a", "claude"], updatedRel: "Updated 1 week ago", helpful: 124,
  },
  {
    cat: "integrations", q: "Can I bring my own identity provider?",
    a: "Yes. Enterprise plans support OIDC and SAML federation for operator identity, and you can issue passports from your own KMS rather than the AgentTag one.",
    readMin: 4, tags: ["enterprise", "oidc", "saml", "kms"], updatedRel: "Updated 2 weeks ago", helpful: 67,
  },
  {
    cat: "security", q: "Is the audit ledger really tamper-evident?",
    a: "Yes. Each entry includes the hash of the previous entry, so the chain is verifiable end-to-end and any retro-edit would break every hash that follows. You can export and re-verify the chain yourself at any time.",
    readMin: 6, tags: ["security", "audit", "hash-chain"], updatedRel: "Updated 4 days ago", helpful: 178,
  },
  {
    cat: "security", q: "What happens if a passport is compromised?",
    a: "Revoke it. The mandate stops being honored on the next request, in-flight sessions are killed, and the audit ledger records the revocation event with a reason. You can also pre-issue scoped, short-lived passports so a single leak is bounded.",
    readMin: 4, tags: ["security", "revocation"], updatedRel: "Updated 6 days ago", helpful: 92,
  },
  {
    cat: "security", q: "Where is data stored and who can see it?",
    a: "Mandates and ledger entries are stored in your region of choice (US, EU, or self-hosted). AgentTag staff only access data at your explicit written request for support, and every such access is itself logged in the ledger.",
    readMin: 3, tags: ["privacy", "data-residency"], updatedRel: "Updated 1 week ago", helpful: 71,
  },
  {
    cat: "billing", q: "What does it cost during the beta?",
    a: "Nothing — the public beta is free with generous usage limits. When we move to general availability, you'll get 30 days' notice and founding-user pricing will be locked in.",
    readMin: 2, tags: ["pricing", "beta"], updatedRel: "Updated 3 days ago", helpful: 245,
  },
  {
    cat: "billing", q: "Will I have to migrate anything when paid plans launch?",
    a: "No. Your agents, mandates, and ledger history carry over. You'll just attach a payment method and pick a plan when the beta period ends.",
    readMin: 2, tags: ["pricing", "migration"], updatedRel: "Updated 1 week ago", helpful: 58,
  },
]

const categories = [
  { id: "fundamentals", title: "Fundamentals", short: "How the control plane works",
    icon: <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="16"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4M12 16h.01"></path></svg> },
  { id: "getting-started", title: "Getting started", short: "Install, mint, ship",
    icon: <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="16"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> },
  { id: "integrations", title: "Integrations", short: "MCP, A2A, Claude, LangChain",
    icon: <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="16"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" x2="20" y1="19" y2="19"></line></svg> },
  { id: "security", title: "Security", short: "Audit, revocation, threat model",
    icon: <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 11 2 2 4-4"></path></svg> },
  { id: "billing", title: "Billing & plans", short: "Beta, GA, and what you pay",
    icon: <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="16"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg> },
]

const featured = [
  { q: "How do I install AgentTag for the first time?", cat: "getting-started", readMin: 2,
    icon: <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="20"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> },
  { q: "What does \u201cgoverned by mandates\u201d mean?", cat: "fundamentals", readMin: 5,
    icon: <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 11 2 2 4-4"></path></svg> },
  { q: "Is the audit ledger really tamper-evident?", cat: "security", readMin: 6,
    icon: <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="20"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> },
]

const announcements = [
  { icon: "🚀", title: "Passkey approvals now available", desc: "Operators can approve step-up requests with Touch ID, Face ID, or a hardware key — no email roundtrip.", rel: "2d ago", tag: "New" },
  { icon: "📊", title: "Audit-ledger export to S3 and GCS", desc: "Stream every signed entry to your own bucket with end-to-end verification.", rel: "1w ago", tag: "Updated" },
  { icon: "🛡️", title: "SOC 2 Type I — in progress", desc: "We're wrapping up the audit. Founding-team customers will get the report first.", rel: "2w ago", tag: "In progress" },
]

// ── Component ───────────────────────────────────────────────────────────────
export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [supportQuery, setSupportQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [newsletterSent, setNewsletterSent] = useState(false)
  const [theme, setTheme] = useState<string>(() => {
    try { return localStorage.getItem("aeg-theme") || "light" } catch { return "light" }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") root.setAttribute("data-theme", "dark")
    else root.removeAttribute("data-theme")
    try { localStorage.setItem("aeg-theme", theme) } catch { /* ignore */ }
  }, [theme])

  useEffect(() => { window.scrollTo(0, 0) }, [])

  const filteredFaqs = faqItems.filter((item) => {
    const matchesCat = activeCategory === "all" || item.cat === activeCategory
    if (!matchesCat) return false
    const q = supportQuery.trim().toLowerCase()
    if (!q) return true
    return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q) ||
           item.tags.some((t) => t.toLowerCase().includes(q))
  })

  const countByCategory = (cat: string) =>
    cat === "all" ? faqItems.length : faqItems.filter((i) => i.cat === cat).length

  const logoSrc = theme === "dark" ? "/logo_bgremoved_inverted.png" : "/logo_bgremoved.png"

  const onNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail.includes("@")) return
    setNewsletterSent(true)
    setNewsletterEmail("")
    setTimeout(() => setNewsletterSent(false), 3000)
  }

  return (
    <div className="aeg-page aeg-dash aeg-dash-support">
      <a className="skip-link" href="#main">Skip to main content</a>

      {/* ── Top nav (matches landing shell, scope-aware) ───────── */}
      <div className="aeg-nav-container">
        <nav className="aeg-nav" aria-label="Main navigation">
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0 40px", maxWidth: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "34px" }}>
              <a href="#/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                <img src={logoSrc} alt="AgentTag Logo" height="24" style={{ height: "24px", width: "auto" }} className="brand-logo-img" />
                <span className="brand-logo-text">AgentTag</span>
              </a>
              <div className="hide-sm" style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                <a className="nav-link" href="#/">Product</a>
                <a className="nav-link" href="#/">Pricing</a>
                <a className="nav-link" href="#/">Docs</a>
                <a className="nav-link is-active" href="#/support" aria-current="page">Support</a>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                aria-label="Toggle dark mode"
                className="theme-toggle"
                title="Toggle dark mode"
                type="button"
                onClick={() => setTheme((p) => (p === "dark" ? "light" : "dark"))}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={theme}
                    initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                    transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {theme === "dark" ? (
                      <svg className="t-moon" fill="none" height="16" viewBox="0 0 24 24" width="16"><path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6"></path></svg>
                    ) : (
                      <svg className="t-sun" fill="none" height="16" viewBox="0 0 24 24" width="16"><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6"></circle><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6"></path></svg>
                    )}
                  </motion.span>
                </AnimatePresence>
              </button>
              <a className="btn-capsule-cta" href="#/">Back to home</a>
            </div>
          </div>
        </nav>
      </div>

      <main id="main">
        <div className="ad-support-shell">
          {/* ── Hero header (dashboard page header style) ─────── */}
          <div className="ad-support-header">
            <div className="ad-support-header-left">
              <div className="ad-eyebrow">
                <span className="ad-eyebrow-dot" />
                Support Center
              </div>
              <h1 className="ad-page-title">How can we help?</h1>
              <p className="ad-page-sub">
                Search 12 articles across the AgentTag knowledge base, or skip ahead and talk to a human. The team responds in under six hours during the beta.
              </p>
            </div>
            <div className="ad-support-header-right">
              <div className="ad-stat-mini">
                <span className="ad-stat-mini-num">12</span>
                <span className="ad-stat-mini-label">articles</span>
              </div>
              <div className="ad-stat-mini">
                <span className="ad-stat-mini-num">&lt;6h</span>
                <span className="ad-stat-mini-label">avg reply</span>
              </div>
              <div className="ad-stat-mini ad-status-up">
                <span className="ad-stat-mini-dot" />
                <div>
                  <span className="ad-stat-mini-num-sm">All systems</span>
                  <span className="ad-stat-mini-label">operational</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Search bar (full width) ──────────────────────── */}
          <div className="ad-search-card ad-card">
            <svg className="ad-search-ico" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
            </svg>
            <input
              type="search"
              value={supportQuery}
              onChange={(e) => setSupportQuery(e.target.value)}
              placeholder="Search articles, error messages, concepts…"
              className="ad-search-input"
              aria-label="Search the support center"
              autoFocus
            />
            {supportQuery && (
              <button type="button" onClick={() => setSupportQuery("")} className="ad-search-clear" aria-label="Clear search">
                <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="14"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>
              </button>
            )}
            <kbd className="ad-search-kbd">⌘K</kbd>
          </div>

          {/* ── Popular search chips ──────────────────────────── */}
          <div className="ad-chips-row">
            <span className="ad-chips-label">Popular</span>
            <button type="button" className="ad-chip" onClick={() => { setActiveCategory("getting-started"); setSupportQuery("install") }}>install cli</button>
            <button type="button" className="ad-chip" onClick={() => { setActiveCategory("fundamentals"); setSupportQuery("passport") }}>passport</button>
            <button type="button" className="ad-chip" onClick={() => { setActiveCategory("security"); setSupportQuery("audit") }}>audit ledger</button>
            <button type="button" className="ad-chip" onClick={() => { setActiveCategory("billing"); setSupportQuery("beta") }}>beta pricing</button>
            <button type="button" className="ad-chip" onClick={() => { setActiveCategory("security"); setSupportQuery("revoke") }}>revoke passport</button>
          </div>

          {/* ── Layout: sidebar + main content ────────────────── */}
          <div className="ad-support-layout">
            {/* Sidebar */}
            <aside className="ad-support-side">
              <div className="ad-card pad ad-side-section">
                <div className="ad-side-title">Browse by topic</div>
                <nav className="ad-side-nav">
                  <button
                    type="button"
                    className={`ad-side-link ${activeCategory === "all" ? "is-active" : ""}`}
                    onClick={() => setActiveCategory("all")}
                  >
                    <span className="ad-side-link-ico">
                      <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="14"><rect x="3" y="3" width="7" height="7" rx="1.2"></rect><rect x="14" y="3" width="7" height="7" rx="1.2"></rect><rect x="3" y="14" width="7" height="7" rx="1.2"></rect><rect x="14" y="14" width="7" height="7" rx="1.2"></rect></svg>
                    </span>
                    <span>All articles</span>
                    <span className="ad-side-link-n">{faqItems.length}</span>
                  </button>
                  {categories.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      className={`ad-side-link ${activeCategory === c.id ? "is-active" : ""}`}
                      onClick={() => setActiveCategory(c.id)}
                    >
                      <span className="ad-side-link-ico">{c.icon}</span>
                      <span>{c.title}</span>
                      <span className="ad-side-link-n">{countByCategory(c.id)}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="ad-card pad ad-side-section">
                <div className="ad-side-title">Other resources</div>
                <nav className="ad-side-nav">
                  <a className="ad-side-link" href="https://status.agenttag.ai" target="_blank" rel="noopener noreferrer">
                    <span className="ad-side-link-ico ad-tone-ok">
                      <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="14"><path d="M3 12h4l3-9 4 18 3-9h4"></path></svg>
                    </span>
                    <span>Status page</span>
                    <span className="ad-side-link-ext">↗</span>
                  </a>
                  <a className="ad-side-link" href="https://github.com/agenttag" target="_blank" rel="noopener noreferrer">
                    <span className="ad-side-link-ico">
                      <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="14"><path d="M9 19c-4 1.4-4-2-6-2m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"></path></svg>
                    </span>
                    <span>GitHub</span>
                    <span className="ad-side-link-ext">↗</span>
                  </a>
                  <a className="ad-side-link" href="https://discord.gg/agenttag" target="_blank" rel="noopener noreferrer">
                    <span className="ad-side-link-ico ad-tone-discord">
                      <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="14"><path d="M7.5 7.2A14 14 0 0 1 12 6.5c1.5 0 3 .2 4.5.7"></path><path d="M16.5 16.8A14 14 0 0 1 12 17.5c-1.5 0-3-.2-4.5-.7"></path><circle cx="9" cy="12" r="1.1" fill="currentColor"></circle><circle cx="15" cy="12" r="1.1" fill="currentColor"></circle></svg>
                    </span>
                    <span>Discord</span>
                    <span className="ad-side-link-ext">↗</span>
                  </a>
                </nav>
              </div>

              <div className="ad-card pad ad-talk-card">
                <div className="ad-talk-eyebrow">Talk to a human</div>
                <p className="ad-talk-desc">Beta users get a direct line to the founders. Real humans, real answers.</p>
                <a className="ad-btn ad-btn-ink ad-btn-block" href="mailto:hello@agenttag.ai">
                  Email support
                  <svg fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="13"><line x1="5" x2="19" y1="12" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </a>
              </div>
            </aside>

            {/* Main content */}
            <div className="ad-support-main">
              {/* ── Featured (only when not searching/filtering) ── */}
              {!supportQuery && activeCategory === "all" && (
                <section className="ad-section">
                  <div className="ad-section-head">
                    <div>
                      <div className="ad-section-eyebrow">Featured</div>
                      <h2 className="ad-section-title">Most-read this week</h2>
                    </div>
                  </div>
                  <div className="ad-grid ad-grid-3">
                    {featured.map((f, i) => {
                      const cat = categories.find((c) => c.id === f.cat)
                      return (
                        <button
                          type="button"
                          key={i}
                          className="ad-card ad-stat-card ad-featured-card"
                          onClick={() => {
                            setSupportQuery("")
                            setActiveCategory(f.cat)
                            const filteredIdx = faqItems
                              .filter((x) => x.cat === f.cat)
                              .findIndex((x) => x.q === f.q)
                            if (filteredIdx >= 0) setOpenFaq(filteredIdx)
                            setTimeout(() => {
                              document.getElementById("ad-articles")?.scrollIntoView({ behavior: "smooth", block: "start" })
                            }, 50)
                          }}
                        >
                          <div className={`ad-stat-ico ad-feat-ico-${f.cat}`}>{f.icon}</div>
                          <div className="ad-featured-cat">{cat?.title}</div>
                          <div className="ad-featured-q">{f.q}</div>
                          <div className="ad-featured-meta">
                            <span className="ad-featured-time">{f.readMin} min read</span>
                            <span className="ad-featured-arrow">Read →</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* ── Announcements ────────────────────────────── */}
              {!supportQuery && activeCategory === "all" && (
                <section className="ad-section">
                  <div className="ad-section-head">
                    <div>
                      <div className="ad-section-eyebrow">Recent updates</div>
                      <h2 className="ad-section-title">What's new</h2>
                    </div>
                    <a className="ad-section-link" href="#/support">View changelog →</a>
                  </div>
                  <div className="ad-card ad-ann-list">
                    {announcements.map((a, i) => (
                      <div className="ad-ann-row" key={i}>
                        <div className="ad-ann-ico">{a.icon}</div>
                        <div className="ad-ann-body">
                          <div className="ad-ann-top">
                            <div className="ad-ann-title">{a.title}</div>
                            <span className={`ad-ann-tag ad-tag-${a.tag.replace(/\s/g, "-").toLowerCase()}`}>{a.tag}</span>
                          </div>
                          <div className="ad-ann-desc">{a.desc}</div>
                        </div>
                        <div className="ad-ann-rel">{a.rel}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── All Articles list ───────────────────────── */}
              <section className="ad-section" id="ad-articles">
                <div className="ad-section-head">
                  <div>
                    <div className="ad-section-eyebrow">
                      {supportQuery
                        ? `${filteredFaqs.length} result${filteredFaqs.length === 1 ? "" : "s"} for \u201c${supportQuery}\u201d`
                        : activeCategory === "all"
                          ? "Knowledge base"
                          : categories.find((c) => c.id === activeCategory)?.title}
                    </div>
                    <h2 className="ad-section-title">
                      {supportQuery
                        ? "Search results"
                        : activeCategory === "all"
                          ? "All articles"
                          : categories.find((c) => c.id === activeCategory)?.title}
                    </h2>
                  </div>
                  {(supportQuery || activeCategory !== "all") && (
                    <button
                      type="button"
                      className="ad-section-link"
                      onClick={() => { setSupportQuery(""); setActiveCategory("all") }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {filteredFaqs.length === 0 ? (
                  <div className="ad-empty-lg">
                    <div className="ad-empty-ico">
                      <svg fill="none" height="48" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" viewBox="0 0 24 24" width="48">
                        <circle cx="11" cy="11" r="7"></circle>
                        <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
                      </svg>
                    </div>
                    <div className="ad-empty-title">No articles match \u201c{supportQuery}\u201d</div>
                    <p className="ad-empty-desc">Try a different keyword, browse a topic in the sidebar, or message the team — they reply in under six hours.</p>
                    <div className="ad-empty-actions">
                      <button type="button" className="ad-btn ad-btn-ghost" onClick={() => { setSupportQuery(""); setActiveCategory("all") }}>Reset filters</button>
                      <a className="ad-btn ad-btn-primary" href="mailto:hello@agenttag.ai">Email the team</a>
                    </div>
                  </div>
                ) : (
                  <div className="ad-stack ad-article-list">
                    {filteredFaqs.map((item) => {
                      const i = filteredFaqs.indexOf(item)
                      const open = openFaq === i
                      const cat = categories.find((c) => c.id === item.cat)
                      return (
                        <article className={`ad-card ad-article${open ? " is-open" : ""}`} key={`${item.cat}-${i}`}>
                          <button
                            className="ad-article-head"
                            type="button"
                            aria-expanded={open}
                            onClick={() => setOpenFaq(open ? null : i)}
                          >
                            <div className="ad-article-head-left">
                              <div className={`ad-article-cat ad-cat-${item.cat}`}>{cat?.title}</div>
                              <h3 className="ad-article-q">{item.q}</h3>
                              <div className="ad-article-meta">
                                <span className="ad-article-meta-item">
                                  <svg fill="none" height="11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="11"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                  {item.readMin} min read
                                </span>
                                <span className="ad-article-meta-item">
                                  <svg fill="none" height="11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="11"><path d="M3 12a9 9 0 1 0 9-9"></path><path d="M3 4v5h5"></path></svg>
                                  {item.updatedRel}
                                </span>
                                <span className="ad-article-meta-item">
                                  <svg fill="none" height="11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="11"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9A2 2 0 0 0 19.7 9H14z"></path><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                                  {item.helpful} found helpful
                                </span>
                              </div>
                            </div>
                            <motion.span
                              className="ad-article-chevron"
                              animate={{ rotate: open ? 180 : 0 }}
                              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                              aria-hidden="true"
                            >
                              <svg fill="none" height="16" width="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </motion.span>
                          </button>
                          <AnimatePresence initial={false}>
                            {open && (
                              <motion.div
                                className="ad-article-body"
                                key="content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                                style={{ overflow: "hidden" }}
                              >
                                <div className="ad-article-prose">
                                  <p>{item.a}</p>
                                  <div className="ad-article-tags">
                                    {item.tags.map((t) => (
                                      <span key={t} className="ad-article-tag">#{t}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="ad-article-foot">
                                  <div className="ad-article-help">
                                    <span>Was this helpful?</span>
                                    <button type="button" className="ad-iconbtn ad-iconbtn-sm" aria-label="Yes">
                                      <svg fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="13"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9A2 2 0 0 0 19.7 9H14z"></path><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                                    </button>
                                    <button type="button" className="ad-iconbtn ad-iconbtn-sm" aria-label="No">
                                      <svg fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="13"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"></path><path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
                                    </button>
                                  </div>
                                  <a className="ad-article-link" href="mailto:hello@agenttag.ai">Still stuck? Talk to us →</a>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* ── Team + Newsletter row ─────────────────────── */}
              <div className="ad-grid ad-grid-2 ad-bottom-grid">
                <section className="ad-card pad ad-team-card">
                  <div className="ad-eyebrow ad-eyebrow-soft">Real humans</div>
                  <h3 className="ad-team-title">An actual person on the other end.</h3>
                  <p className="ad-team-desc">No support tiers, no chatbots in disguise. The team that builds AgentTag is the team that answers your email.</p>
                  <div className="ad-team-stats">
                    <div>
                      <div className="ad-team-num">&lt; 6h</div>
                      <div className="ad-team-lbl">Avg reply</div>
                    </div>
                    <div>
                      <div className="ad-team-num">100%</div>
                      <div className="ad-team-lbl">In-house</div>
                    </div>
                    <div>
                      <div className="ad-team-num">~12h</div>
                      <div className="ad-team-lbl">First fix</div>
                    </div>
                  </div>
                </section>

                <section className="ad-card pad ad-news-card">
                  <div className="ad-eyebrow ad-eyebrow-soft">Monthly digest</div>
                  <h3 className="ad-team-title">Product updates, one email a month.</h3>
                  <p className="ad-team-desc">New features, security disclosures, and changelog highlights. No marketing fluff.</p>
                  <form className="ad-news-form" onSubmit={onNewsletterSubmit}>
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      aria-label="Email for product updates"
                    />
                    <button type="submit" className={newsletterSent ? "is-sent" : ""}>
                      {newsletterSent ? "✓ Subscribed" : "Subscribe"}
                    </button>
                  </form>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer (matches landing) ────────────────────────── */}
      <footer className="aeg-footer" aria-label="Site footer">
        <div className="aeg-wrap">
          <div className="footer-top-row">
            <div className="footer-brand-col">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img src={logoSrc} alt="AgentTag" height="24" style={{ height: "24px", width: "auto" }} />
                <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.3px", color: "var(--ink)", textTransform: "uppercase", fontFamily: "'Bricolage Grotesque', sans-serif" }}>AgentTag</span>
              </div>
              <p className="footer-brand-tagline">The control plane for delegated agent identity. Your agent, its own passport.</p>
            </div>
          </div>
          <div className="footer-columns-row">
            <div>
              <div className="footer-col-title">Links</div>
              <a className="footer-link" href="#/">Home</a>
              <a className="footer-link" href="#/">Platform</a>
              <a className="footer-link" href="#/">Pricing</a>
              <a className="footer-link" href="#/">Docs</a>
            </div>
            <div>
              <div className="footer-col-title">Support</div>
              <a className="footer-link" href="#/support">Knowledge base</a>
              <a className="footer-link" href="https://status.agenttag.ai" target="_blank" rel="noopener noreferrer">System status</a>
              <a className="footer-link" href="mailto:hello@agenttag.ai">Contact us</a>
            </div>
            <div>
              <div className="footer-col-title">Socials</div>
              <a className="footer-link" href="https://github.com/agenttag" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a className="footer-link" href="https://discord.gg/agenttag" target="_blank" rel="noopener noreferrer">Discord</a>
              <a className="footer-link" href="https://x.com/agenttag" target="_blank" rel="noopener noreferrer">X (Formerly Twitter)</a>
            </div>
          </div>
          <div className="footer-standards">
            <span className="footer-standards-label">Built to standards</span>
            <div className="footer-standards-badges">
              <span className="footer-standards-badge">Ed25519</span>
              <span className="footer-standards-badge">W3C DID</span>
              <span className="footer-standards-badge">WebAuthn · Passkeys</span>
              <span className="footer-standards-badge">MCP-native</span>
              <span className="footer-standards-badge">SOC&nbsp;2 · in progress</span>
            </div>
          </div>
          <div className="footer-divider"></div>
          <div className="footer-bottom-row">
            <div className="footer-copyright">© Copyright 2026 AgentTag.ai</div>
            <div className="footer-legal-links">
              <a className="footer-legal-link" href="#/terms">Terms of Service</a>
              <a className="footer-legal-link" href="#/privacy">Privacy Policy</a>
              <a className="footer-legal-link" href="#/data-tos">Data Platform TOS</a>
            </div>
          </div>
          <div className="footer-watermark">AgentTag</div>
        </div>
      </footer>
    </div>
  )
}
