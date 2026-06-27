import { useMemo, useState } from "react";
import {
  Cpu, ShieldCheck, Inbox as InboxIcon, DollarSign, Activity, AlertTriangle,
  Pause, Play, Ban, Plus, Check, X, Clock, Search, Download,
  CreditCard, MessageSquare, Cloud, Database, Laptop, Smartphone, KeyRound,
  Trash2, Bell, Server, Wand2, MoreHorizontal, ArrowUpRight,
  ChevronDown, LayoutGrid, Sun,
} from "lucide-react";
import {
  useStore, verdictTone, riskTone, timeAgo, money,
  type Provider, type Device,
} from "./data";
import { Btn, IconBtn, Chip, Toggle, EmptyState, PageHeader } from "./ui";
import type { RouteKey } from "./Dashboard";

const statusTone = (s: string) => (s === "active" ? "ok" : s === "paused" ? "warn" : "bad");

// ============================================================
// Dashboard / Overview (Efferd Design Style + AgentTag Content)
// ============================================================

export function OverviewPage({ onNav }: { onNav: (k: RouteKey) => void }) {
  const { agents, approvals, ledger, settings } = useStore();
  const spend = agents.reduce((s, a) => s + a.spendUsed, 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const decisionsToday = ledger.length + 38;
  const recent = [...ledger].slice(-7).reverse();

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: "transparent" }}>
      {/* Top Header Bar */}
      <div className="ad-topbar" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 28px",
        borderBottom: "1px solid var(--d-line)",
        background: "color-mix(in srgb, var(--d-bg-2) 50%, transparent)",
        backdropFilter: "blur(8px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 500, color: "var(--d-muted)" }}>
          <LayoutGrid size={15} />
          <h1 style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "var(--d-muted)", fontFamily: "inherit", letterSpacing: "normal" }}>Dashboard</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--d-soft)",
            border: "1px solid var(--d-line)",
            borderRadius: "6px",
            padding: "5px 12px",
            width: "160px"
          }}>
            <Search size={13} style={{ color: "var(--d-faint)" }} />
            <span style={{ fontSize: "12px", color: "var(--d-faint)", flex: 1 }}>Find</span>
            <span style={{
              fontSize: "9px",
              background: "var(--d-hover)",
              border: "1px solid var(--d-line)",
              borderRadius: "3px",
              padding: "1px 4px",
              color: "var(--d-faint)"
            }}>F</span>
          </div>
          <div style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#fff",
            overflow: "hidden",
            display: "grid",
            placeItems: "center"
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
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "var(--d-ink)", letterSpacing: "-0.01em" }}>Welcome back</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button style={{
              background: "var(--d-panel)",
              border: "1px solid var(--d-line)",
              borderRadius: "6px",
              padding: "5px 12px",
              fontSize: "12px",
              color: "var(--d-muted)",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer"
            }}>
              <span>Last 4 hours</span>
              <ChevronDown size={12} />
            </button>
            <button style={{
              background: "var(--d-panel)",
              border: "1px solid var(--d-line)",
              borderRadius: "6px",
              padding: "5px 8px",
              fontSize: "12px",
              color: "var(--d-muted)",
              cursor: "pointer"
            }}>
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
        <div className="ad-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {/* Card 1: Pending Approvals */}
          <div className="ad-card pad ad-rise" style={{ background: "var(--d-panel)", border: "1px solid var(--d-line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--d-faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span>Pending approvals</span>
              <InboxIcon size={14} style={{ color: "var(--d-faint)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", width: "100%" }}>
              <span className="mono" style={{ fontSize: "24px", fontWeight: 700, color: "var(--d-ink)" }}>{approvals.length}</span>
              <span style={{ marginLeft: "auto" }}>
                <Chip tone={approvals.length ? "warn" : "ok"}>
                  {approvals.length ? "needs review" : "all clear"}
                </Chip>
              </span>
            </div>
            <div style={{ marginTop: "12px", height: "20px" }}>
              <svg viewBox="0 0 100 20" width="100%" height="100%" preserveAspectRatio="none">
                <path d={approvals.length ? "M 0,18 Q 15,5 30,12 T 60,8 T 90,15 T 100,5" : "M 0,18 L 100,18"} fill="none" stroke={approvals.length ? "color-mix(in srgb, var(--d-warn) 40%, transparent)" : "color-mix(in srgb, var(--d-ok) 40%, transparent)"} strokeWidth="1.2" />
              </svg>
            </div>
          </div>

          {/* Card 2: Active Agents */}
          <div className="ad-card pad ad-rise" style={{ background: "var(--d-panel)", border: "1px solid var(--d-line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--d-faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span>Active agents</span>
              <Cpu size={14} style={{ color: "var(--d-faint)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
              <span className="mono" style={{ fontSize: "24px", fontWeight: 700, color: "var(--d-ink)" }}>{`${activeAgents}/${agents.length}`}</span>
              <span style={{ fontSize: "11px", color: "var(--d-faint)", marginLeft: "auto" }}>
                governed
              </span>
            </div>
            <div style={{ marginTop: "12px", height: "20px" }}>
              <svg viewBox="0 0 100 20" width="100%" height="100%" preserveAspectRatio="none">
                <path d="M 0,10 L 20,10 L 40,8 L 60,12 L 80,10 L 100,10" fill="none" stroke="var(--d-line)" strokeWidth="1.2" />
              </svg>
            </div>
          </div>

          {/* Card 3: Spend this month */}
          <div className="ad-card pad ad-rise" style={{ background: "var(--d-panel)", border: "1px solid var(--d-line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--d-faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span>Spend this month</span>
              <DollarSign size={14} style={{ color: "var(--d-faint)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
              <span className="mono" style={{ fontSize: "22px", fontWeight: 700, color: "var(--d-ink)" }}>{money(spend)}</span>
              <span style={{ fontSize: "11px", color: "var(--d-faint)", marginLeft: "auto" }}>
                across mandates
              </span>
            </div>
            <div style={{ marginTop: "12px", height: "20px" }}>
              <svg viewBox="0 0 100 20" width="100%" height="100%" preserveAspectRatio="none">
                <path d="M 0,18 Q 20,10 40,15 T 80,5 T 100,12" fill="none" stroke="var(--d-line)" strokeWidth="1.2" />
              </svg>
            </div>
          </div>

          {/* Card 4: Decisions today */}
          <div className="ad-card pad ad-rise" style={{ background: "var(--d-panel)", border: "1px solid var(--d-line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--d-faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span>Decisions today</span>
              <Activity size={14} style={{ color: "var(--d-faint)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
              <span className="mono" style={{ fontSize: "24px", fontWeight: 700, color: "var(--d-ink)" }}>{decisionsToday}</span>
              <span style={{ fontSize: "11px", color: "var(--d-ok)", display: "inline-flex", alignItems: "center", gap: "2px", marginLeft: "auto" }}>
                <ArrowUpRight size={10} /> +12 vs yesterday
              </span>
            </div>
            <div style={{ marginTop: "12px", height: "20px" }}>
              <svg viewBox="0 0 100 20" width="100%" height="100%" preserveAspectRatio="none">
                <path d="M 0,15 L 10,18 L 20,8 L 30,20 L 40,10 L 50,22 L 60,14 L 70,22 L 80,10 L 100,12" fill="none" stroke="color-mix(in srgb, var(--d-ok) 40%, transparent)" strokeWidth="1.2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Live Audit Ledger & Agents List */}
        <div className="ad-grid" style={{ gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>
          {/* Live Audit Ledger */}
          <div className="ad-card pad ad-rise" style={{ background: "var(--d-panel)", border: "1px solid var(--d-line)" }}>
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
                <div key={e.seq} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
                  <Chip tone={verdictTone(e.verdict)} dot>{e.verdict}</Chip>
                  <span className="mono" style={{ fontSize: "12.5px", color: "var(--d-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{e.action}</span>
                  <span style={{ fontSize: "11.5px", color: "var(--d-faint)", flex: "none" }}>{e.agent}</span>
                  <span className="mono" style={{ fontSize: "11.5px", color: "var(--d-faint)", flex: "none" }}>{timeAgo(e.ts)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agents */}
          <div className="ad-card pad ad-rise" style={{ background: "var(--d-panel)", border: "1px solid var(--d-line)" }}>
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
                      <span style={{ display: "block", height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--d-crimson), var(--d-info))", borderRadius: "4px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Governance
// ============================================================
export function GovernancePage() {
  const { agents, toggleAgentEnforcement, setAgentStatus, toast } = useStore();
  return (
    <>
      <PageHeader
        title="Governance"
        subtitle="Every agent, its mandates, and the limits you've signed."
        actions={<Btn variant="primary" icon={<Plus size={15} />} onClick={() => toast("New mandate — opens the policy composer", "info")}>New mandate</Btn>}
      />
      <div className="ad-scroll">
        <div className="ad-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))" }}>
          {agents.map((a) => {
            const pct = Math.min(100, (a.spendUsed / a.spendLimit) * 100);
            return (
              <div key={a.id} className="ad-card pad hover ad-rise">
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
              </div>
            );
          })}
        </div>
      </div>
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
// Inbox
// ============================================================
export function InboxPage({ onNav }: { onNav: (k: RouteKey) => void }) {
  const { approvals, resolveApproval } = useStore();
  const [filter, setFilter] = useState<"all" | "STEP_UP" | "NOTICE">("all");
  const shown = approvals.filter((a) => filter === "all" || a.kind === filter);

  return (
    <>
      <PageHeader
        title="Inbox"
        subtitle="Pending requests waiting on your signature."
        actions={
          <div className="ad-seg">
            {(["all", "STEP_UP", "NOTICE"] as const).map((f) => (
              <button key={f} className={filter === f ? "is-active" : ""} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : f === "STEP_UP" ? "Step-up" : "Notice"}
              </button>
            ))}
          </div>
        }
      />
      <div className="ad-scroll">
        {shown.length === 0 ? (
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
              {/* Layered opacity icon */}
              <div style={{ position: "relative", marginBottom: "20px", display: "flex", alignItems: "center", justifyItems: "center" }}>
                <div style={{
                  position: "absolute",
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "var(--crimson-tint)",
                  opacity: 0.4,
                  animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                  transform: "scale(1.2)"
                }} style-disabled="true" className="pulse-circle" />
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
        ) : (
          <div className="ad-stack" style={{ maxWidth: 760 }}>
            {shown.map((a) => (
              <div key={a.id} className="ad-card pad ad-rise">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Chip tone={a.kind === "STEP_UP" ? "warn" : "info"} dot>{a.kind === "STEP_UP" ? "STEP-UP" : "NOTICE"}</Chip>
                  <Chip tone={riskTone(a.risk)}>{a.risk} risk</Chip>
                  <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--d-faint)" }}>
                    <Clock size={13} /> {timeAgo(a.createdAt)}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 650, marginBottom: 4 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: "var(--d-muted)", marginBottom: 16 }}>{a.agent} · {a.detail}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ok" icon={<Check size={15} />} onClick={() => resolveApproval(a.id, "approve")}>Approve & sign</Btn>
                  <Btn variant="danger" icon={<X size={15} />} onClick={() => resolveApproval(a.id, "deny")}>Deny</Btn>
                  <span style={{ marginLeft: "auto", alignSelf: "center", fontSize: 11.5, color: "var(--d-faint)" }}>Signed on-device · passkey</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
              {f === "all" ? "All verdicts" : f === "STEP_UP" ? "Step-up" : f.charAt(0) + f.slice(1).toLowerCase()}
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
        <div className="ad-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {providers.map((p) => (
            <div key={p.id} className="ad-row ad-rise">
              <span className="ad-row-ico" style={{ color: p.connected ? "var(--d-crimson)" : "var(--d-faint)" }}>{provIcon(p.category)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ad-row-name">{p.name}</div>
                <div className="ad-row-desc">{p.desc}</div>
              </div>
              {p.connected
                ? <Btn sm variant="ghost" onClick={() => toggleProvider(p.id)}>Disconnect</Btn>
                : <Btn sm variant="primary" onClick={() => toggleProvider(p.id)}>Connect</Btn>}
            </div>
          ))}
        </div>
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
        <div className="ad-stack" style={{ maxWidth: 720 }}>
          {devices.map((d) => (
            <div key={d.id} className="ad-row ad-rise">
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
            </div>
          ))}
        </div>
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
        <div className="ad-stack" style={{ maxWidth: 720 }}>
          <section className="ad-card pad ad-rise">
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
          </section>

          <section className="ad-card pad ad-rise">
            <div className="ad-section-title"><KeyRound size={15} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />License</div>
            <div className="ad-section-sub">Activate a key to enable enforcement in production.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="ad-input" placeholder="paste your license key" value={key} onChange={(e) => setKey(e.target.value)} />
              <Btn variant="primary" disabled={!key.trim()} onClick={() => { updateSettings({ licenseKey: key.trim() }); toast("License activated", "ok"); }}>Activate</Btn>
            </div>
          </section>

          <section className="ad-card pad ad-rise">
            <div className="ad-section-title"><Server size={15} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />Backend API</div>
            <div className="ad-section-sub">Where the dashboard reaches your control plane.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="ad-input mono" value={api} onChange={(e) => setApi(e.target.value)} />
              <Btn variant="ghost" onClick={() => { updateSettings({ apiUrl: api }); toast("Endpoint saved", "ok"); }}>Save</Btn>
            </div>
          </section>

          <section className="ad-card pad ad-rise">
            <div className="ad-section-title"><Bell size={15} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />Notifications</div>
            <div className="ad-section-sub">How we reach you when an agent needs a signature.</div>
            <div className="ad-stack">
              <div className="ad-row" style={{ background: "transparent" }}>
                <div style={{ flex: 1 }}><div className="ad-row-name">Email</div><div className="ad-row-desc">operator@aegis.dev</div></div>
                <Toggle on={settings.notifyEmail} onClick={() => updateSettings({ notifyEmail: !settings.notifyEmail })} label="email notifications" />
              </div>
              <div className="ad-row" style={{ background: "transparent" }}>
                <div style={{ flex: 1 }}><div className="ad-row-name">SMS</div><div className="ad-row-desc">+1 ••• ••• 4471</div></div>
                <Toggle on={settings.notifySms} onClick={() => updateSettings({ notifySms: !settings.notifySms })} label="sms notifications" />
              </div>
            </div>
          </section>

          <section className="ad-card pad ad-rise">
            <div className="ad-section-title"><Wand2 size={15} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />Setup</div>
            <div className="ad-section-sub">Re-run the guided setup wizard.</div>
            <Btn variant="ghost" icon={<Wand2 size={15} />} onClick={onReopenWizard}>Open setup wizard</Btn>
          </section>
        </div>
      </div>
    </>
  );
}
