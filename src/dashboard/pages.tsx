import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Cpu, ShieldCheck, Inbox as InboxIcon, DollarSign, Activity, AlertTriangle,
  Pause, Play, Ban, Plus, Check, X, Clock, Search, Download,
  CreditCard, MessageSquare, Cloud, Database, Laptop, Smartphone, KeyRound,
  Trash2, Server, Settings, MoreHorizontal, ArrowUpRight,
  ChevronDown, LayoutGrid, Sun, Fingerprint,
} from "lucide-react";
import {
  useStore, verdictTone, riskTone, timeAgo, money,
  type Provider, type Device,
} from "./data";
import { Btn, IconBtn, Chip, Toggle, EmptyState, PageHeader, InteractiveChart, CountdownRing, JsonTree, PolicyComposer, BiometricOverlay } from "./ui";
import type { RouteKey } from "./Dashboard";

const statusTone = (s: string) => (s === "active" ? "ok" : s === "paused" ? "warn" : "bad");

// Stagger wrapper for cards
const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// ============================================================
// Dashboard / Overview
// ============================================================

// Chart mock data
const SPEND_DATA = [
  { label: "Mon", value: 42 }, { label: "Tue", value: 58 }, { label: "Wed", value: 35 },
  { label: "Thu", value: 72 }, { label: "Fri", value: 91 }, { label: "Sat", value: 64 },
  { label: "Sun", value: 83 },
];
const DECISION_DATA = [
  { label: "Mon", value: 12 }, { label: "Tue", value: 28 }, { label: "Wed", value: 19 },
  { label: "Thu", value: 35 }, { label: "Fri", value: 47 }, { label: "Sat", value: 31 },
  { label: "Sun", value: 42 },
];

export function OverviewPage({ onNav }: { onNav: (k: RouteKey) => void }) {
  const { agents, approvals, ledger, settings, toast } = useStore();
  const spend = agents.reduce((s, a) => s + a.spendUsed, 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const decisionsToday = ledger.length + 38;
  const recent = [...ledger].slice(-7).reverse();

  const approvalsData = useMemo(() => [
    { label: "Mon", value: 1 },
    { label: "Tue", value: 3 },
    { label: "Wed", value: 2 },
    { label: "Thu", value: Math.max(0, approvals.length - 1) },
    { label: "Fri", value: approvals.length },
  ], [approvals.length]);

  const activeAgentsData = useMemo(() => [
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 2 },
    { label: "Thu", value: activeAgents },
    { label: "Fri", value: activeAgents },
  ], [activeAgents]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: "transparent" }}>
      <div className="ad-topbar" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 500, color: "var(--d-muted)" }}>
          <LayoutGrid size={15} />
          <h1 style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "var(--d-muted)", fontFamily: "inherit", letterSpacing: "normal" }}>Dashboard</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => toast("Global search opened (Cmd+K)", "info")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--d-soft)",
              border: "1px solid var(--d-line)",
              borderRadius: "var(--d-r-sm)",
              padding: "0 12px",
              width: "160px",
              height: "28px",
              cursor: "pointer",
              textAlign: "left",
              font: "inherit",
              color: "inherit",
              boxSizing: "border-box"
            }}
          >
            <Search size={13} style={{ color: "var(--d-faint)" }} />
            <span style={{ fontSize: "12px", color: "var(--d-faint)", flex: 1, lineHeight: 1 }}>Find</span>
            <span style={{
              fontSize: "9px",
              background: "var(--d-hover)",
              border: "1px solid var(--d-line)",
              borderRadius: "3px",
              color: "var(--d-faint)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "15px",
              width: "15px",
              lineHeight: 1
            }}>F</span>
          </button>
          <div style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "#fff",
            overflow: "hidden",
            display: "grid",
            placeItems: "center",
            boxSizing: "border-box"
          }}>
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80" alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </div>

      <div className="ad-scroll" style={{ padding: "24px 28px" }}>
        {/* Welcome Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Sun size={20} style={{ color: "var(--d-muted)" }} />
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--d-ink)", letterSpacing: "-0.02em", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Welcome back</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button 
              onClick={() => toast("Timeframe selection menu opened", "info")}
              style={{
                background: "var(--d-panel)",
                border: "1px solid var(--d-line)",
                borderRadius: "var(--d-r-sm)",
                padding: "5px 12px",
                fontSize: "12px",
                color: "var(--d-muted)",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer"
              }}
            >
              <span>Last 4 hours</span>
              <ChevronDown size={12} />
            </button>
            <button
              aria-label="More options"
              title="More options"
              onClick={() => toast("More dashboard options coming soon", "info")}
              style={{
                background: "var(--d-panel)",
                border: "1px solid var(--d-line)",
                borderRadius: "var(--d-r-sm)",
                padding: "5px 8px",
                fontSize: "12px",
                color: "var(--d-muted)",
                cursor: "pointer"
              }}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Warning Banner if Enforcement is off */}
        {!settings.enforcement && (
          <div className="ad-banner warn ad-rise" style={{ marginBottom: 20 }}>
            <AlertTriangle size={18} style={{ flex: "none", marginTop: 1 }} />
            <div>
              <b>Enforcement is OFF.</b> Agents run unrestricted — policies are evaluated but not enforced. Turn it back on in Settings.
            </div>
          </div>
        )}

        {/* Metrics Grid (4 Columns) */}
        <motion.div className="ad-metrics-grid" variants={stagger} initial="hidden" animate="visible">
          {/* Card 1: Pending Approvals */}
          <motion.div variants={fadeUp} className="ad-card pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--d-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              <span>Pending approvals</span>
              <InboxIcon size={14} style={{ color: "var(--d-muted)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px", width: "100%" }}>
              <span className="tnum ad-metric-val" style={{ fontSize: "32px", fontWeight: 800 }}>{approvals.length}</span>
              <span style={{ marginLeft: "auto" }}>
                <Chip tone={approvals.length ? "warn" : "ok"}>
                  {approvals.length ? "needs review" : "all clear"}
                </Chip>
              </span>
            </div>
            <InteractiveChart data={approvalsData} height={60} color={approvals.length ? "var(--d-warn)" : "var(--d-ok)"} />
          </motion.div>

          {/* Card 2: Active Agents */}
          <motion.div variants={fadeUp} className="ad-card pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--d-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              <span>Active agents</span>
              <Cpu size={14} style={{ color: "var(--d-muted)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
              <span className="tnum ad-metric-val" style={{ fontSize: "32px", fontWeight: 800 }}>{`${activeAgents}/${agents.length}`}</span>
              <span style={{ fontSize: "11px", color: "var(--d-faint)", marginLeft: "auto" }}>
                governed
              </span>
            </div>
            <InteractiveChart data={activeAgentsData} height={60} color="var(--d-faint)" />
          </motion.div>

          {/* Card 3: Spend this month — Interactive Chart */}
          <motion.div variants={fadeUp} className="ad-card pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--d-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              <span>Spend this month</span>
              <DollarSign size={14} style={{ color: "var(--d-muted)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
              <span className="tnum ad-metric-val" style={{ fontSize: "28px", fontWeight: 800 }}>{money(spend)}</span>
              <span style={{ fontSize: "11px", color: "var(--d-faint)", marginLeft: "auto" }}>
                across mandates
              </span>
            </div>
            <InteractiveChart data={SPEND_DATA} height={60} color="var(--d-ink)" unit="$" />
          </motion.div>

          {/* Card 4: Decisions today — Interactive Chart */}
          <motion.div variants={fadeUp} className="ad-card pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--d-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              <span>Decisions today</span>
              <Activity size={14} style={{ color: "var(--d-muted)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
              <span className="tnum ad-metric-val" style={{ fontSize: "32px", fontWeight: 800 }}>{decisionsToday}</span>
              <span style={{ fontSize: "11px", color: "var(--d-ok)", display: "inline-flex", alignItems: "center", gap: "2px", marginLeft: "auto" }}>
                <ArrowUpRight size={10} /> +12 vs yesterday
              </span>
            </div>
            <InteractiveChart data={DECISION_DATA} height={60} color="var(--d-ok)" />
          </motion.div>
        </motion.div>

        {/* Live Audit Ledger & Agents List */}
        <motion.div className="ad-grid" style={{ gridTemplateColumns: "1.5fr 1fr", gap: "16px" }} variants={stagger} initial="hidden" animate="visible">
          {/* Live Audit Ledger */}
          <motion.div variants={fadeUp} className="ad-card pad">
            <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 650, color: "var(--d-ink)" }}>Live audit ledger</div>
                <div style={{ fontSize: "12px", color: "var(--d-faint)", marginTop: "2px" }}>Hash-chained · tamper-evident</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="ad-chip ok" style={{ padding: "2px 8px", fontSize: "10px" }}><span className="dot" />LIVE</span>
                <Btn sm variant="ghost" onClick={() => onNav("history")}>View all</Btn>
              </div>
            </div>
            <div className="ad-stack" style={{ gap: "12px" }}>
              {recent.map((e) => (
                <div key={e.seq} className="ad-ledger-row">
                  <Chip tone={verdictTone(e.verdict)} dot>{e.verdict}</Chip>
                  <span className="mono" style={{ fontSize: "12.5px", color: "var(--d-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{e.action}</span>
                  <span style={{ fontSize: "11.5px", color: "var(--d-faint)", flex: "none" }}>{e.agent}</span>
                  <span className="mono" style={{ fontSize: "11.5px", color: "var(--d-faint)", flex: "none" }}>{timeAgo(e.ts)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Agents */}
          <motion.div variants={fadeUp} className="ad-card pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 650, color: "var(--d-ink)" }}>Agents</div>
                <div style={{ fontSize: "12px", color: "var(--d-faint)", marginTop: "2px" }}>Status & monthly spend</div>
              </div>
              <Btn sm variant="ghost" onClick={() => onNav("governance")}>Manage</Btn>
            </div>
            <div className="ad-stack" style={{ gap: "16px" }}>
              {agents.map((a) => {
                const pct = Math.min(100, (a.spendUsed / a.spendLimit) * 100);
                return (
                  <div key={a.id} style={{ padding: "2px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, fontSize: "13px" }}>
                      <span style={{ fontWeight: 600, color: "var(--d-ink)" }}>{a.name}</span>
                      <Chip tone={statusTone(a.status) as "ok" | "warn" | "bad"} dot>{a.status}</Chip>
                      <span className="mono" style={{ marginLeft: "auto", fontSize: "12px", color: "var(--d-faint)" }}>
                        {money(a.spendUsed)} <span style={{ color: "var(--d-faint)" }}>/ {money(a.spendLimit)}</span>
                      </span>
                    </div>
                    {/* Meter */}
                    <div className="ad-meter" style={{ height: "6px", background: "var(--d-track)", borderRadius: "4px", overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--d-ink), var(--d-faint))", borderRadius: "4px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================
// Governance — with Policy Composer
// ============================================================
export function GovernancePage() {
  const { agents, toggleAgentEnforcement, setAgentStatus, toast } = useStore();
  const [composerOpen, setComposerOpen] = useState(false);

  const handleComposerSubmit = (_template: string, name: string, limit: number) => {
    toast(`Mandate "${name}" ($${limit}) signed & deployed`, "ok");
  };

  return (
    <>
      <PageHeader
        title="Governance"
        subtitle="Every agent, its mandates, and the limits you've signed."
        actions={<Btn variant="primary" icon={<Plus size={15} />} onClick={() => setComposerOpen(true)}>New mandate</Btn>}
      />
      <div className="ad-scroll">
        <motion.div className="ad-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))" }} variants={stagger} initial="hidden" animate="visible">
          {agents.map((a) => {
            const pct = Math.min(100, (a.spendUsed / a.spendLimit) * 100);
            return (
              <motion.div key={a.id} variants={fadeUp} className="ad-card pad hover">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span className="ad-row-ico" style={{ color: "var(--d-crimson)" }}><Cpu size={18} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 650, fontSize: 15 }}>{a.name}</span>
                      <Chip tone={statusTone(a.status) as "ok" | "warn" | "bad"} dot>{a.status}</Chip>
                    </div>
                    <div className="mono" style={{ fontSize: 11.5, color: "var(--d-faint)", marginTop: 3 }}>{a.did}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
                    <span style={{ fontSize: 11.5, color: "var(--d-faint)" }}>Enforce</span>
                    <Toggle on={a.enforcement} onClick={() => toggleAgentEnforcement(a.id)} label={`enforcement for ${a.name}`} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 18, margin: "16px 0 14px" }}>
                  <Metric label="Tasks run" value={a.tasks.toLocaleString()} />
                  <Metric label="Spend" value={`${money(a.spendUsed)} / ${money(a.spendLimit)}`} />
                </div>
                <div className="ad-meter" style={{ marginBottom: 16 }}><span style={{ width: `${pct}%` }} /></div>

                <div style={{ fontSize: 11.5, color: "var(--d-faint)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Mandates</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
                  {a.mandates.map((m) => (
                    <span key={m.id} className="ad-chip muted" title={m.detail}><KeyRound size={11} /> {m.label}</span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {a.status === "active" ? (
                    <Btn sm variant="ghost" icon={<Pause size={14} />} onClick={() => setAgentStatus(a.id, "paused")}>Pause</Btn>
                  ) : a.status === "paused" ? (
                    <Btn sm variant="ghost" icon={<Play size={14} />} onClick={() => setAgentStatus(a.id, "active")}>Resume</Btn>
                  ) : (
                    <Btn sm variant="ghost" icon={<Play size={14} />} onClick={() => setAgentStatus(a.id, "active")}>Reactivate</Btn>
                  )}
                  {a.status !== "revoked" && (
                    <Btn sm variant="danger" icon={<Ban size={14} />} onClick={() => setAgentStatus(a.id, "revoked")}>Revoke</Btn>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      <AnimatePresence>
        {composerOpen && <PolicyComposer onClose={() => setComposerOpen(false)} onSubmit={handleComposerSubmit} />}
      </AnimatePresence>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--d-faint)", marginBottom: 3 }}>{label}</div>
      <div className="mono" style={{ fontSize: 13.5, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

// ============================================================
// Inbox — Split-Pane with Biometric
// ============================================================
export function InboxPage({ onNav }: { onNav: (k: RouteKey) => void }) {
  const { approvals, resolveApproval } = useStore();
  const [filter, setFilter] = useState<"all" | "STEP_UP" | "NOTICE">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bioTarget, setBioTarget] = useState<string | null>(null);
  const shown = approvals.filter((a) => filter === "all" || a.kind === filter);
  const selected = shown.find((a) => a.id === selectedId) || null;

  const handleApprove = useCallback((id: string) => {
    setBioTarget(id);
  }, []);

  const handleBioComplete = useCallback(() => {
    if (bioTarget) {
      resolveApproval(bioTarget, "approve");
      setSelectedId(null);
      setBioTarget(null);
    }
  }, [bioTarget, resolveApproval]);

  // JSON payload for detail view
  const policyJson = selected ? {
    request_id: selected.id,
    kind: selected.kind,
    risk_level: selected.risk,
    agent: selected.agent,
    action: selected.title,
    mandate_evaluation: {
      policy_matched: "spend-cap-v2",
      threshold_exceeded: selected.kind === "STEP_UP",
      requires_signature: true,
    },
    timestamp: new Date(selected.createdAt).toISOString(),
  } : null;

  return (
    <>
      <PageHeader
        title="Inbox"
        subtitle="Pending requests waiting on your signature."
        actions={
          <div className="ad-seg">
            {(["all", "STEP_UP", "NOTICE"] as const).map((f) => (
              <button key={f} className={filter === f ? "is-active" : ""} onClick={() => setFilter(f)}>
                {filter === f && (
                  <motion.div
                    layoutId="active-seg-inbox"
                    className="ad-seg-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span>{f === "all" ? "All" : f === "STEP_UP" ? "Step-up" : "Notice"}</span>
              </button>
            ))}
          </div>
        }
      />

      {shown.length === 0 ? (
        <div className="ad-scroll">
          <div className="ad-card" style={{ display: "grid", placeItems: "center", padding: "64px 24px", position: "relative", overflow: "hidden" }}>
            {/* Background wireframe decoration */}
            <div style={{ position: "absolute", inset: 0, opacity: 0.05, pointerEvents: "none", zIndex: 0 }}>
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-empty" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-empty)" />
              </svg>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1, maxWidth: "420px" }}>
              <div style={{ position: "relative", marginBottom: "20px", display: "flex", alignItems: "center", justifyItems: "center" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, var(--d-crimson) 0%, var(--d-info) 100%)",
                  color: "#fff",
                  boxShadow: "0 8px 24px -6px rgba(var(--accent-rgb), 0.3)",
                }}>
                  <Check size={28} strokeWidth={2.5} />
                </div>
              </div>

              <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px", color: "var(--d-ink)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Inbox zero</h3>
              <p style={{ fontSize: "13.5px", color: "var(--d-muted)", lineHeight: "1.5", margin: "0 0 24px" }}>
                All clear! No pending actions require your signature at the moment.
              </p>
              
              <div style={{
                background: "var(--d-soft)",
                border: "1px solid var(--d-line)",
                borderRadius: "8px",
                padding: "16px",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--d-ink)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Next Steps</div>
                <div style={{ fontSize: "12.5px", color: "var(--d-muted)", lineHeight: "1.4", marginBottom: "12px" }}>
                  Configure additional governance mandates or connect more service providers to expand coverage.
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <Btn sm variant="primary" onClick={() => onNav("governance")}>Configure mandates</Btn>
                  <Btn sm variant="ghost" onClick={() => onNav("providers")}>Connect providers</Btn>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="ad-inbox-split">
          {/* Left: List */}
          <div className="ad-inbox-list">
            <AnimatePresence>
              {shown.map((a) => (
                <motion.div
                  key={a.id}
                  className={`ad-inbox-item${selectedId === a.id ? " selected" : ""}`}
                  onClick={() => setSelectedId(a.id)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* eslint-disable-next-line react-hooks/purity */}
                  <CountdownRing remaining={Math.max(0, Math.floor((a.createdAt + 3600000 - Date.now()) / 1000))} total={3600} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Chip tone={a.kind === "STEP_UP" ? "warn" : "info"} dot>{a.kind === "STEP_UP" ? "STEP-UP" : "NOTICE"}</Chip>
                      <Chip tone={riskTone(a.risk)}>{a.risk} risk</Chip>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--d-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: "var(--d-faint)", marginTop: 2 }}>{a.agent} · {timeAgo(a.createdAt)}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Right: Detail */}
          <div className="ad-inbox-detail">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Chip tone={selected.kind === "STEP_UP" ? "warn" : "info"} dot>{selected.kind === "STEP_UP" ? "STEP-UP" : "NOTICE"}</Chip>
                      <Chip tone={riskTone(selected.risk)}>{selected.risk} risk</Chip>
                      <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--d-faint)" }}>
                        <Clock size={13} /> {timeAgo(selected.createdAt)}
                      </span>
                    </div>
                    <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "var(--d-ink)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{selected.title}</h2>
                    <div style={{ fontSize: 13.5, color: "var(--d-muted)" }}>{selected.agent} · {selected.detail}</div>
                  </div>

                  {/* JSON policy tree */}
                  <div>
                    <div style={{ fontSize: 11, color: "var(--d-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontWeight: 600 }}>Mandate Evaluation</div>
                    {policyJson && <JsonTree data={policyJson as Record<string, unknown>} />}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--d-line)" }}>
                    <Btn variant="ok" icon={<Fingerprint size={15} />} onClick={() => handleApprove(selected.id)}>Approve & sign</Btn>
                    <Btn variant="danger" icon={<X size={15} />} onClick={() => { resolveApproval(selected.id, "deny"); setSelectedId(null); }}>Deny</Btn>
                    <span style={{ marginLeft: "auto", alignSelf: "center", fontSize: 11.5, color: "var(--d-faint)" }}>Signed on-device · passkey</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="ad-inbox-detail-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <InboxIcon size={24} style={{ opacity: 0.3 }} />
                    <span>Select a request to inspect</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <AnimatePresence>
        {bioTarget && <BiometricOverlay onComplete={handleBioComplete} />}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// History
// ============================================================
export function HistoryPage() {
  const { ledger, toast } = useStore();
  const [q, setQ] = useState("");
  const [vf, setVf] = useState<"all" | "ALLOW" | "STEP_UP" | "DENY">("all");
  const rows = useMemo(() => {
    return [...ledger].reverse().filter((e) => {
      const matchQ = !q || (e.action + " " + e.agent).toLowerCase().includes(q.toLowerCase());
      const matchV = vf === "all" || e.verdict === vf;
      return matchQ && matchV;
    });
  }, [ledger, q, vf]);

  return (
    <>
      <PageHeader
        title="History"
        subtitle="Every decision, hash-chained and independently verifiable."
        actions={
          <>
            <div className="ad-search">
              <Search />
              <input placeholder="Search actions, agents…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Btn variant="ghost" icon={<Download size={15} />} onClick={() => toast(`Exported ${rows.length} records`, "ok")}>Export</Btn>
          </>
        }
      />
      <div className="ad-scroll">
        <div className="ad-seg" style={{ marginBottom: 16 }}>
          {(["all", "ALLOW", "STEP_UP", "DENY"] as const).map((f) => (
            <button key={f} className={vf === f ? "is-active" : ""} onClick={() => setVf(f)}>
              {vf === f && (
                <motion.div
                  layoutId="active-seg-history"
                  className="ad-seg-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span>{f === "all" ? "All verdicts" : f === "STEP_UP" ? "Step-up" : f.charAt(0) + f.slice(1).toLowerCase()}</span>
            </button>
          ))}
        </div>
        <div className="ad-card ad-rise" style={{ overflow: "hidden" }}>
          {rows.length === 0 ? (
            <EmptyState icon={<Search size={22} />} title="No matching records">Try a different search or verdict filter.</EmptyState>
          ) : (
            <table className="ad-table">
              <thead>
                <tr><th>Seq</th><th>Event</th><th>Action</th><th>Agent</th><th>Verdict</th><th>When</th><th>Hash</th></tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.seq}>
                    <td className="mono" style={{ color: "var(--d-faint)" }}>{e.seq}</td>
                    <td><span className="ad-chip muted">{e.eventType}</span></td>
                    <td className="mono" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.action}</td>
                    <td style={{ color: "var(--d-muted)" }}>{e.agent}</td>
                    <td><Chip tone={verdictTone(e.verdict)} dot>{e.verdict}</Chip></td>
                    <td className="mono" style={{ color: "var(--d-faint)", whiteSpace: "nowrap" }}>{timeAgo(e.ts)}</td>
                    <td className="mono" style={{ color: "var(--d-faint)" }}>{e.hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================
// Providers
// ============================================================
const provIcon = (c: Provider["category"]) =>
  c === "payments" ? <CreditCard size={18} /> : c === "comms" ? <MessageSquare size={18} /> : c === "data" ? <Database size={18} /> : <Cloud size={18} />;

export function ProvidersPage() {
  const { providers, toggleProvider, toast } = useStore();
  const connected = providers.filter((p) => p.connected).length;
  return (
    <>
      <PageHeader
        title="Providers"
        subtitle={`${connected} of ${providers.length} connected — credentials stay vaulted, never exposed to the agent.`}
        actions={<Btn variant="primary" icon={<Plus size={15} />} onClick={() => toast("Browse the provider catalog", "info")}>Connect new</Btn>}
      />
      <div className="ad-scroll">
        <motion.div className="ad-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }} variants={stagger} initial="hidden" animate="visible">
          {providers.map((p) => (
            <motion.div key={p.id} variants={fadeUp} className="ad-row">
              <span className="ad-row-ico" style={{ color: p.connected ? "var(--d-crimson)" : "var(--d-faint)" }}>{provIcon(p.category)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ad-row-name">{p.name}</div>
                <div className="ad-row-desc">{p.desc}</div>
              </div>
              {p.connected
                ? <Btn sm variant="ghost" onClick={() => toggleProvider(p.id)}>Disconnect</Btn>
                : <Btn sm variant="primary" onClick={() => toggleProvider(p.id)}>Connect</Btn>}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
}

// ============================================================
// Devices
// ============================================================
const devIcon = (k: Device["kind"]) => (k === "laptop" ? <Laptop size={18} /> : k === "phone" ? <Smartphone size={18} /> : <KeyRound size={18} />);

export function DevicesPage() {
  const { devices, revokeDevice, addDevice } = useStore();
  return (
    <>
      <PageHeader
        title="Devices"
        subtitle="Passkey-bound devices that can sign approvals on your behalf."
        actions={<Btn variant="primary" icon={<Plus size={15} />} onClick={() => addDevice("New passkey · " + new Date().toLocaleTimeString(), "security-key")}>Link device</Btn>}
      />
      <div className="ad-scroll">
        <motion.div className="ad-stack" style={{ maxWidth: 720 }} variants={stagger} initial="hidden" animate="visible">
          {devices.map((d) => (
            <motion.div key={d.id} variants={fadeUp} className="ad-row">
              <span className="ad-row-ico">{devIcon(d.kind)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ad-row-name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {d.name}
                  {d.current && <Chip tone="ok" dot>this device</Chip>}
                </div>
                <div className="ad-row-desc">Last active {timeAgo(d.lastSeen)} · passkey</div>
              </div>
              <IconBtn aria-label={`revoke ${d.name}`} disabled={d.current} title={d.current ? "Can't revoke the current device" : "Revoke"} onClick={() => revokeDevice(d.id)} style={d.current ? { opacity: .4, cursor: "not-allowed" } : undefined}>
                <Trash2 />
              </IconBtn>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
}

// ============================================================
// Settings
// ============================================================
export function SettingsPage({ onReopenWizard }: { onReopenWizard: () => void }) {
  const { settings, updateSettings, toast } = useStore();
  const [key, setKey] = useState(settings.licenseKey);
  const [api, setApi] = useState(settings.apiUrl);

  return (
    <>
      <PageHeader title="Settings" subtitle="Enforcement, license, and how Aegis reaches you." />
      <div className="ad-scroll">
        <motion.div className="ad-stack" style={{ maxWidth: 720 }} variants={stagger} initial="hidden" animate="visible">
          <motion.section variants={fadeUp} className="ad-card pad">
            <div className="ad-section-title"><ShieldCheck size={15} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />Enforcement</div>
            <div className="ad-section-sub">When on, every action is checked against its mandate before it runs.</div>
            <div className="ad-row" style={{ background: "transparent", border: "1px solid var(--d-line)" }}>
              <div style={{ flex: 1 }}>
                <div className="ad-row-name">Global enforcement</div>
                <div className="ad-row-desc">{settings.enforcement ? "Active — policies are enforced." : "Off — testing mode, nothing is blocked."}</div>
              </div>
              <Toggle on={settings.enforcement} onClick={() => updateSettings({ enforcement: !settings.enforcement })} label="global enforcement" />
            </div>
            <div style={{ marginTop: 14 }}>
              <label className="ad-field-label">Step-up threshold (USD)</label>
              <input className="ad-input" type="number" value={settings.stepUpThreshold} onChange={(e) => updateSettings({ stepUpThreshold: Number(e.target.value) || 0 })} style={{ maxWidth: 200 }} />
            </div>
          </motion.section>

          <motion.section variants={fadeUp} className="ad-card pad">
            <div className="ad-section-title"><KeyRound size={15} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />License</div>
            <div className="ad-section-sub">Activate a key to enable enforcement in production.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="ad-input" placeholder="paste your license key" value={key} onChange={(e) => setKey(e.target.value)} />
              <Btn variant="primary" disabled={!key.trim()} onClick={() => { updateSettings({ licenseKey: key.trim() }); toast("License activated", "ok"); }}>Activate</Btn>
            </div>
          </motion.section>

          <motion.section variants={fadeUp} className="ad-card pad">
            <div className="ad-section-title"><Server size={15} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />Backend API</div>
            <div className="ad-section-sub">Where the dashboard reaches your control plane.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="ad-input mono" value={api} onChange={(e) => setApi(e.target.value)} />
              <Btn variant="ghost" onClick={() => { updateSettings({ apiUrl: api }); toast("Endpoint saved", "ok"); }}>Save</Btn>
            </div>
          </motion.section>

          <motion.section variants={fadeUp} className="ad-card pad">
            <div className="ad-section-title"><Settings size={15} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />Setup</div>
            <div className="ad-section-sub">Re-run the guided setup wizard.</div>
            <Btn variant="ghost" icon={<Settings size={15} />} onClick={onReopenWizard}>Open setup wizard</Btn>
          </motion.section>
        </motion.div>
      </div>
    </>
  );
}
