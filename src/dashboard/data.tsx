/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

// ============================================================
// Types
// ============================================================
export type Verdict = "ALLOW" | "STEP_UP" | "NOTICE" | "DENY";
export type Risk = "low" | "medium" | "high";

export interface Mandate {
  id: string;
  label: string;
  detail: string;
  active: boolean;
}

export interface Agent {
  id: string;
  name: string;
  did: string;
  status: "active" | "paused" | "revoked";
  enforcement: boolean;
  spendUsed: number;
  spendLimit: number;
  tasks: number;
  mandates: Mandate[];
}

export interface Approval {
  id: string;
  agent: string;
  title: string;
  detail: string;
  amount?: number;
  merchant?: string;
  category: string;
  risk: Risk;
  kind: Verdict; // STEP_UP / NOTICE
  createdAt: number;
}

export interface LedgerEntry {
  seq: number;
  eventType: "policy" | "action" | "approval" | "cred_use" | "comms";
  action: string;
  verdict: Verdict | "OK" | "-";
  ts: number;
  hash: string;
  agent: string;
}

export interface Provider {
  id: string;
  name: string;
  desc: string;
  connected: boolean;
  category: "payments" | "comms" | "compute" | "data";
  // Credentials are populated when the operator connects a provider via the
  // Connect modal. They stay in memory — never sent to the agent. Keys vary by
  // provider (e.g. stripe → apiKey, twilio → accountSid/authToken/fromNumber,
  // github → personalAccessToken).
  credentials?: Record<string, string>;
  connectedAt?: number;
}

export interface Device {
  id: string;
  name: string;
  kind: "laptop" | "phone" | "security-key";
  lastSeen: number;
  current: boolean;
  // For devices paired via WebAuthn — the credential id (base64url-encoded rawId).
  credentialId?: string;
  // When the device was paired (distinct from lastSeen which tracks activity).
  pairedAt?: number;
}

export type NotifyEvent =
  | "stepup_required"
  | "mandate_denied"
  | "mandate_expiring"
  | "device_paired"
  | "member_invited"
  | "weekly_digest";

export type NotifyChannel = "email" | "sms" | "push";

export interface Settings {
  enforcement: boolean;
  licenseKey: string;
  apiUrl: string;
  stepUpThreshold: number;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyPush: boolean;
  notifyRouting: Record<NotifyEvent, Record<NotifyChannel, boolean>>;
  quietHoursStart?: string;            // "22:00"
  quietHoursEnd?: string;              // "07:00"
  quietHoursTz?: string;               // IANA tz
}

// ============================================================
// Mock data
// ============================================================
const now = Date.now();
const mins = (m: number) => now - m * 60_000;

const hashAt = (seed: number) =>
  "0x" + (((seed * 2654435761) >>> 0).toString(16) + "000000").slice(0, 6) + "…";

const seedAgents: Agent[] = [
  {
    id: "ag_research",
    name: "Research Agent",
    did: "did:key:z6MkvS…W8X23b",
    status: "active",
    enforcement: true,
    spendUsed: 342.18,
    spendLimit: 500,
    tasks: 1284,
    mandates: [
      { id: "m1", label: "saas-spend-limit", detail: "≤ $500 / mo · saas only", active: true },
      { id: "m2", label: "mcp-tools-allowlist", detail: "browse, pay, comms, deploy", active: true },
      { id: "m3", label: "step-up-new-merchant", detail: "approve > $200 or new payee", active: true },
    ],
  },
  {
    id: "ag_ops",
    name: "Ops Agent",
    did: "did:key:z6Mip2…Qr71kd",
    status: "active",
    enforcement: true,
    spendUsed: 88.0,
    spendLimit: 250,
    tasks: 643,
    mandates: [
      { id: "m4", label: "deploy-allowlist", detail: "vercel, railway, fly", active: true },
      { id: "m5", label: "no-prod-secrets", detail: "vault.use only, never read", active: true },
    ],
  },
  {
    id: "ag_support",
    name: "Support Agent",
    did: "did:key:z6Mkt9…Lm04ze",
    status: "paused",
    enforcement: false,
    spendUsed: 0,
    spendLimit: 100,
    tasks: 211,
    mandates: [
      { id: "m6", label: "comms-only", detail: "email + sms, no payments", active: true },
    ],
  },
  {
    id: "ag_finance",
    name: "Finance Agent",
    did: "did:key:z6MkuY…Lm84fa",
    status: "active",
    enforcement: true,
    spendUsed: 140.0,
    spendLimit: 300,
    tasks: 512,
    mandates: [
      { id: "m7", label: "billing-sync", detail: "read stripe + sync to quickbooks", active: true },
      { id: "m8", label: "pay-invoices", detail: "invoice processing ≤ $300", active: true },
    ],
  },
  {
    id: "ag_security",
    name: "Security Enforcer",
    did: "did:key:z6MkvW…Ab12cd",
    status: "active",
    enforcement: true,
    spendUsed: 20.0,
    spendLimit: 50,
    tasks: 4521,
    mandates: [
      { id: "m9", label: "audit-logs-signing", detail: "sign and push logs hourly", active: true },
      { id: "m10", label: "ip-blocklist", detail: "update firewall rules dynamically", active: true },
    ],
  },
  {
    id: "ag_customer",
    name: "Customer Care",
    did: "did:key:z6MkpX…Yz89fg",
    status: "paused",
    enforcement: false,
    spendUsed: 0,
    spendLimit: 200,
    tasks: 92,
    mandates: [
      { id: "m11", label: "zendesk-read-only", detail: "fetch tickets, no modify", active: true },
    ],
  },
];

const seedApprovals: Approval[] = [
  {
    id: "ap_1",
    agent: "Research Agent",
    title: "Pay $840.00 to Acme Data Inc",
    detail: "category: data · new merchant · mnd_01H…",
    amount: 840,
    merchant: "Acme Data Inc",
    category: "data",
    risk: "high",
    kind: "STEP_UP",
    createdAt: mins(3),
  },
  {
    id: "ap_2",
    agent: "Ops Agent",
    title: "Deploy api.agents.host to production",
    detail: "firecracker microVM · 2 new env vars",
    category: "compute",
    risk: "medium",
    kind: "NOTICE",
    createdAt: mins(11),
  },
  {
    id: "ap_3",
    agent: "Research Agent",
    title: "Provision new phone number",
    detail: "+1 area 415 · verification routing",
    category: "comms",
    risk: "low",
    kind: "NOTICE",
    createdAt: mins(26),
  },
  {
    id: "ap_4",
    agent: "Research Agent",
    title: "Pay $1,200.00 to Northwind Cloud",
    detail: "category: infra · over monthly threshold",
    amount: 1200,
    merchant: "Northwind Cloud",
    category: "infra",
    risk: "high",
    kind: "STEP_UP",
    createdAt: mins(52),
  },
];

const ledgerPool: Omit<LedgerEntry, "seq" | "ts" | "hash">[] = [
  { eventType: "policy", action: "pay $5.00 → vercel · saas mandate", verdict: "ALLOW", agent: "Research Agent" },
  { eventType: "action", action: "deploy thing.agents.host · microVM", verdict: "NOTICE", agent: "Ops Agent" },
  { eventType: "cred_use", action: "vault → github_agent token", verdict: "-", agent: "Ops Agent" },
  { eventType: "policy", action: "browse linear.app · signup", verdict: "ALLOW", agent: "Research Agent" },
  { eventType: "comms", action: "await_verification · inbox", verdict: "OK", agent: "Support Agent" },
  { eventType: "policy", action: "pay $840 → acme data · new", verdict: "STEP_UP", agent: "Research Agent" },
  { eventType: "approval", action: "operator signed envelope", verdict: "ALLOW", agent: "Research Agent" },
  { eventType: "policy", action: "transfer ← operator bank", verdict: "DENY", agent: "Research Agent" },
];

const seedLedger: LedgerEntry[] = Array.from({ length: 9 }).map((_, i) => {
  const base = ledgerPool[i % ledgerPool.length];
  const seq = 1040 + i;
  return { ...base, seq, ts: mins(9 - i + 1), hash: hashAt(seq) };
});

const seedProviders: Provider[] = [
  { id: "stripe", name: "Stripe", desc: "Issue & charge virtual cards", connected: true, category: "payments" },
  { id: "twilio", name: "Twilio", desc: "Route SMS verification codes", connected: true, category: "comms" },
  { id: "agentmail", name: "AgentMail", desc: "Send & receive agent email", connected: true, category: "comms" },
  { id: "agentcard", name: "AgentCard", desc: "Issue programmable virtual cards", connected: true, category: "payments" },
  { id: "playwright", name: "Playwright", desc: "Headless browser automation", connected: true, category: "compute" },
];

const seedDevices: Device[] = [
  { id: "d1", name: "MacBook Pro · operator", kind: "laptop", lastSeen: mins(2), current: true },
  { id: "d2", name: "iPhone 16 · approvals", kind: "phone", lastSeen: mins(40), current: false },
  { id: "d3", name: "YubiKey 5C", kind: "security-key", lastSeen: mins(60 * 26), current: false },
  { id: "d4", name: "iPad Pro · reviews", kind: "phone", lastSeen: mins(60 * 3), current: false },
  { id: "d5", name: "Dell XPS 15 · secondary", kind: "laptop", lastSeen: mins(60 * 48), current: false },
  { id: "d6", name: "YubiKey 5 NFC", kind: "security-key", lastSeen: mins(60 * 72), current: false },
];

// ============================================================
// Store
// ============================================================
export interface Toast {
  id: number;
  msg: string;
  tone: "ok" | "bad" | "info";
}

interface StoreShape {
  agents: Agent[];
  approvals: Approval[];
  ledger: LedgerEntry[];
  providers: Provider[];
  devices: Device[];
  settings: Settings;
  toasts: Toast[];
  resolveApproval: (id: string, decision: "approve" | "deny") => void;
  toggleAgentEnforcement: (id: string) => void;
  setAgentStatus: (id: string, status: Agent["status"]) => void;
  updateAgent: (id: string, patch: Partial<Omit<Agent, "id" | "did" | "spendUsed" | "tasks">>) => void;
  toggleMandate: (agentId: string, mandateId: string) => void;
  removeMandate: (agentId: string, mandateId: string) => void;
  addMandate: (agentId: string, label: string, detail: string) => void;
  toggleProvider: (id: string) => void;
  connectProvider: (id: string, credentials: Record<string, string>) => void;
  disconnectProvider: (id: string) => void;
  revokeDevice: (id: string) => void;
  addDevice: (name: string, kind: Device["kind"], opts?: { credentialId?: string; pairedAt?: number }) => void;
  updateSettings: (patch: Partial<Settings>, reason?: string) => void;
  recordSettingChange: (key: keyof Settings, from: unknown, to: unknown, reason?: string) => void;
  toast: (msg: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
}

const StoreContext = createContext<StoreShape | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(seedAgents);
  const [approvals, setApprovals] = useState<Approval[]>(seedApprovals);
  const [ledger, setLedger] = useState<LedgerEntry[]>(seedLedger);
  const [providers, setProviders] = useState<Provider[]>(seedProviders);
  const [devices, setDevices] = useState<Device[]>(seedDevices);
  const [settings, setSettings] = useState<Settings>(() => {
    const defaults: Settings = {
      enforcement: true,
      licenseKey: "",
      apiUrl: "https://aegis-backend-production-a853.up.railway.app",
      stepUpThreshold: 200,
      notifyEmail: true,
      notifySms: true,
      notifyPush: false,
      notifyRouting: {
        stepup_required:   { email: true,  sms: false, push: true  },
        mandate_denied:    { email: true,  sms: true,  push: true  },
        mandate_expiring:  { email: true,  sms: false, push: false },
        device_paired:     { email: true,  sms: false, push: true  },
        member_invited:    { email: true,  sms: false, push: false },
        weekly_digest:     { email: true,  sms: false, push: false },
      },
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      quietHoursTz: "America/Sao_Paulo",
    };
    try {
      const raw = window.localStorage.getItem("aeg-settings");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        return { ...defaults, ...parsed };
      }
    } catch {
      /* localStorage unavailable or corrupt — use defaults */
    }
    return defaults;
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seqRef = useRef(1049);
  const toastIdRef = useRef(1);

  const toast: StoreShape["toast"] = (msg, tone = "info") => {
    const id = toastIdRef.current++;
    setToasts((t) => [...t, { id, msg, tone }].slice(-3));
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };
  const dismissToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const pushLedger = (action: string, verdict: LedgerEntry["verdict"], agent: string, eventType: LedgerEntry["eventType"]) => {
    const seq = ++seqRef.current;
    setLedger((l) => [...l, { seq, action, verdict, agent, eventType, ts: Date.now(), hash: hashAt(seq) }].slice(-40));
  };

  const resolveApproval: StoreShape["resolveApproval"] = (id, decision) => {
    setApprovals((list) => {
      const item = list.find((a) => a.id === id);
      if (item) {
        pushLedger(
          item.title.toLowerCase(),
          decision === "approve" ? "ALLOW" : "DENY",
          item.agent,
          "approval"
        );
        toast(
          decision === "approve" ? `Approved · signed with passkey` : `Denied · ${item.agent}`,
          decision === "approve" ? "ok" : "bad"
        );
      }
      return list.filter((a) => a.id !== id);
    });
  };

  const toggleAgentEnforcement: StoreShape["toggleAgentEnforcement"] = (id) => {
    setAgents((list) =>
      list.map((a) => {
        if (a.id !== id) return a;
        const next = !a.enforcement;
        toast(`${a.name}: enforcement ${next ? "ON" : "OFF"}`, next ? "ok" : "info");
        return { ...a, enforcement: next };
      })
    );
  };

  const setAgentStatus: StoreShape["setAgentStatus"] = (id, status) => {
    setAgents((list) =>
      list.map((a) => {
        if (a.id !== id) return a;
        toast(`${a.name} ${status === "revoked" ? "revoked" : status}`, status === "revoked" ? "bad" : "info");
        return { ...a, status };
      })
    );
  };

  const updateAgent: StoreShape["updateAgent"] = (id, patch) => {
    setAgents((list) =>
      list.map((a) => {
        if (a.id !== id) return a;
        const next = { ...a, ...patch };
        toast(`${next.name} updated`, "ok");
        pushLedger(`policy edit: ${next.name}`, "ALLOW", "operator", "policy");
        return next;
      })
    );
  };

  const toggleMandate: StoreShape["toggleMandate"] = (agentId, mandateId) => {
    setAgents((list) =>
      list.map((a) => {
        if (a.id !== agentId) return a;
        const mandates = a.mandates.map((m) =>
          m.id === mandateId ? { ...m, active: !m.active } : m
        );
        return { ...a, mandates };
      })
    );
  };

  const removeMandate: StoreShape["removeMandate"] = (agentId, mandateId) => {
    setAgents((list) =>
      list.map((a) => {
        if (a.id !== agentId) return a;
        return { ...a, mandates: a.mandates.filter((m) => m.id !== mandateId) };
      })
    );
  };

  const addMandate: StoreShape["addMandate"] = (agentId, label, detail) => {
    const trimmedLabel = label.trim();
    const trimmedDetail = detail.trim();
    if (!trimmedLabel) return;
    const newMandate: Mandate = {
      id: "m_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      label: trimmedLabel,
      detail: trimmedDetail || "—",
      active: true,
    };
    setAgents((list) =>
      list.map((a) =>
        a.id === agentId ? { ...a, mandates: [...a.mandates, newMandate] } : a
      )
    );
    toast(`Mandate "${trimmedLabel}" added`, "ok");
  };

  const toggleProvider: StoreShape["toggleProvider"] = (id) => {
    setProviders((list) =>
      list.map((p) => {
        if (p.id !== id) return p;
        const next = !p.connected;
        toast(`${p.name} ${next ? "connected" : "disconnected"}`, next ? "ok" : "info");
        return { ...p, connected: next };
      })
    );
  };

  const connectProvider: StoreShape["connectProvider"] = (id, credentials) => {
    setProviders((list) =>
      list.map((p) => {
        if (p.id !== id) return p;
        toast(`${p.name} connected`, "ok");
        return { ...p, connected: true, credentials, connectedAt: Date.now() };
      })
    );
    const provider = providers.find((p) => p.id === id);
    pushLedger(`vault → ${id} credentials`, "ALLOW", "operator", "cred_use");
    void provider; // referenced for clarity
  };

  const disconnectProvider: StoreShape["disconnectProvider"] = (id) => {
    setProviders((list) =>
      list.map((p) => {
        if (p.id !== id) return p;
        toast(`${p.name} disconnected`, "info");
        return { ...p, connected: false, credentials: undefined, connectedAt: undefined };
      })
    );
    pushLedger(`revoke ${id} credentials`, "ALLOW", "operator", "cred_use");
  };

  const revokeDevice: StoreShape["revokeDevice"] = (id) => {
    setDevices((list) => {
      const d = list.find((x) => x.id === id);
      if (d) toast(`${d.name} revoked`, "bad");
      return list.filter((x) => x.id !== id);
    });
  };

  const addDevice: StoreShape["addDevice"] = (name, kind, opts) => {
    const now = Date.now();
    setDevices((list) => [...list, {
      id: "d" + now,
      name,
      kind,
      lastSeen: now,
      current: false,
      credentialId: opts?.credentialId,
      pairedAt: opts?.pairedAt ?? now,
    }]);
    toast(`${name} linked`, "ok");
  };

  const updateSettings: StoreShape["updateSettings"] = (patch, reason) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      let changed = false;
      (Object.keys(patch) as Array<keyof Settings>).forEach((k) => {
        if (s[k] !== patch[k]) {
          recordSettingChange(k, s[k], patch[k], reason);
          changed = true;
        }
      });
      if (changed) {
        try {
          window.localStorage.setItem("aeg-settings", JSON.stringify(next));
        } catch {
          /* localStorage unavailable — ignore */
        }
      }
      return next;
    });
  };

  const recordSettingChange: StoreShape["recordSettingChange"] = (key, from, to, reason) => {
    const summary = `set ${String(key)}: ${JSON.stringify(from)} → ${JSON.stringify(to)}`;
    const action = reason ? `${summary} (${reason})` : summary;
    pushLedger(action, "OK", "operator", "policy");
  };

  // Live ledger heartbeat — appends a benign event periodically.
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = window.setInterval(() => {
      const e = ledgerPool[Math.floor(seqRef.current) % ledgerPool.length];
      if (e.verdict === "ALLOW" || e.verdict === "OK" || e.verdict === "-") {
        pushLedger(e.action, e.verdict, e.agent, e.eventType);
      }
    }, 4200);
    return () => clearInterval(t);
  }, []);

  const value = useMemo<StoreShape>(
    () => ({
      agents, approvals, ledger, providers, devices, settings, toasts,
      resolveApproval, toggleAgentEnforcement, setAgentStatus,
      updateAgent, toggleMandate, removeMandate, addMandate,
      toggleProvider, connectProvider, disconnectProvider,
      revokeDevice, addDevice, updateSettings, recordSettingChange, toast, dismissToast,
    }),
    [agents, approvals, ledger, providers, devices, settings, toasts]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

// ============================================================
// Helpers
// ============================================================
export const verdictTone = (v: LedgerEntry["verdict"]): "ok" | "info" | "warn" | "bad" | "muted" => {
  switch (v) {
    case "ALLOW":
    case "OK":
      return "ok";
    case "NOTICE":
      return "info";
    case "STEP_UP":
      return "warn";
    case "DENY":
      return "bad";
    default:
      return "muted";
  }
};

export const riskTone = (r: Risk): "ok" | "warn" | "bad" => (r === "high" ? "bad" : r === "medium" ? "warn" : "ok");

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const money = (n: number) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
