import { useMemo, useState } from "react";
import {
  Inbox as InboxIcon, DollarSign, Activity, Cpu, ShieldCheck,
  Pause, Play, Ban, Plus, Check, X, Clock, AlertTriangle, Search, Download,
  CreditCard, MessageSquare, Cloud, Database, Laptop, Smartphone, KeyRound,
  Trash2, Bell, Server, Wand2,
} from "lucide-react";
import {
  useStore, verdictTone, riskTone, timeAgo, money,
  type LedgerEntry, type Provider, type Device,
} from "./data";
import { Btn, IconBtn, Chip, Toggle, StatCard, EmptyState, PageHeader } from "./ui";
import type { RouteKey } from "./Dashboard";

const statusTone = (s: string) => (s === "active" ? "ok" : s === "paused" ? "warn" : "bad");

// ============================================================
// Dashboard / Overview
// ============================================================
export function OverviewPage({ onNav }: { onNav: (k: RouteKey) => void }) {
  const { agents, approvals, ledger, settings } = useStore();
  const spend = agents.reduce((s, a) => s + a.spendUsed, 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const decisionsToday = ledger.length + 38;
  const recent = [...ledger].slice(-7).reverse();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of every governed agent."
        actions={
          <Btn variant="primary" icon={<InboxIcon size={15} />} onClick={() => onNav("inbox")}>
            Review approvals{approvals.length ? ` · ${approvals.length}` : ""}
          </Btn>
        }
      />
      <div className="ad-scroll">
        {!settings.enforcement && (
          <div className="ad-banner warn ad-rise" style={{ marginBottom: 20 }}>
            <AlertTriangle size={18} style={{ flex: "none", marginTop: 1 }} />
            <div>
              <b>Enforcement is OFF.</b> Agents run unrestricted — policies are evaluated but not enforced. Turn it back on in Settings.
            </div>
          </div>
        )}

        <div className="ad-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
          <StatCard label="Pending approvals" value={approvals.length} icon={<InboxIcon size={16} />} delta={approvals.length ? "needs review" : "all clear"} deltaTone={approvals.length ? "bad" : "ok"} />
          <StatCard label="Active agents" value={`${activeAgents}/${agents.length}`} icon={<Cpu size={16} />} delta="governed" />
          <StatCard label="Spend this month" value={money(spend)} icon={<DollarSign size={16} />} delta="across mandates" deltaTone="muted" />
          <StatCard label="Decisions today" value={decisionsToday} icon={<Activity size={16} />} delta="+12 vs yesterday" />
        </div>

        <div className="ad-grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
          <div className="ad-card pad ad-rise">
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div className="ad-section-title">Live audit ledger</div>
                <div className="ad-section-sub" style={{ margin: 0 }}>Hash-chained · tamper-evident</div>
              </div>
              <Chip tone="ok" dot>LIVE</Chip>
              <Btn sm variant="ghost" style={{ marginLeft: "auto" }} onClick={() => onNav("history")}>View all</Btn>
            </div>
            <div className="ad-stack">
              {recent.map((e) => <LedgerRow key={e.seq} e={e} />)}
            </div>
          </div>

          <div className="ad-card pad ad-rise">
            <div className="ad-section-title">Agents</div>
            <div className="ad-section-sub">Status & monthly spend</div>
            <div className="ad-stack">
              {agents.map((a) => {
                const pct = Math.min(100, (a.spendUsed / a.spendLimit) * 100);
                return (
                  <div key={a.id} style={{ padding: "2px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</span>
                      <Chip tone={statusTone(a.status) as "ok" | "warn" | "bad"} dot>{a.status}</Chip>
                      <span className="mono" style={{ marginLeft: "auto", fontSize: 12, color: "var(--d-faint)" }}>
                        {money(a.spendUsed)} <span style={{ opacity: .6 }}>/ {money(a.spendLimit)}</span>
                      </span>
                    </div>
                    <div className="ad-meter"><span style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function LedgerRow({ e }: { e: LedgerEntry }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Chip tone={verdictTone(e.verdict)} dot>{e.verdict}</Chip>
      <span className="mono" style={{ fontSize: 12.5, color: "var(--d-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{e.action}</span>
      <span style={{ fontSize: 11.5, color: "var(--d-faint)", flex: "none" }}>{e.agent}</span>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--d-faint)", flex: "none" }}>{timeAgo(e.ts)}</span>
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
export function InboxPage() {
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
          <div className="ad-card"><EmptyState icon={<Check size={22} />} title="Inbox zero">No pending approvals. New requests from your agents will appear here.</EmptyState></div>
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
