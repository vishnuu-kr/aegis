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
}

export interface Device {
  id: string;
  name: string;
  kind: "laptop" | "phone" | "security-key";
  lastSeen: number;
  current: boolean;
}

export interface Settings {
  enforcement: boolean;
  licenseKey: string;
  apiUrl: string;
  stepUpThreshold: number;
  notifyEmail: boolean;
  notifySms: boolean;
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
  { id: "github", name: "GitHub Actions", desc: "Scoped deploy tokens", connected: true, category: "compute" },
  { id: "vercel", name: "Vercel", desc: "Host & deploy projects", connected: false, category: "compute" },
  { id: "cloudflare", name: "Cloudflare", desc: "DNS & edge workers", connected: false, category: "compute" },
  { id: "postgres", name: "Postgres", desc: "Managed agent database", connected: false, category: "data" },
];

const seedDevices: Device[] = [
  { id: "d1", name: "MacBook Pro · operator", kind: "laptop", lastSeen: mins(2), current: true },
  { id: "d2", name: "iPhone 16 · approvals", kind: "phone", lastSeen: mins(40), current: false },
  { id: "d3", name: "YubiKey 5C", kind: "security-key", lastSeen: mins(60 * 26), current: false },
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
  toggleProvider: (id: string) => void;
  revokeDevice: (id: string) => void;
  addDevice: (name: string, kind: Device["kind"]) => void;
  updateSettings: (patch: Partial<Settings>) => void;
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
  const [settings, setSettings] = useState<Settings>({
    enforcement: true,
    licenseKey: "",
    apiUrl: "https://aegis-backend-production-a853.up.railway.app",
    stepUpThreshold: 200,
    notifyEmail: true,
    notifySms: true,
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

  const revokeDevice: StoreShape["revokeDevice"] = (id) => {
    setDevices((list) => {
      const d = list.find((x) => x.id === id);
      if (d) toast(`${d.name} revoked`, "bad");
      return list.filter((x) => x.id !== id);
    });
  };

  const addDevice: StoreShape["addDevice"] = (name, kind) => {
    setDevices((list) => [...list, { id: "d" + Date.now(), name, kind, lastSeen: Date.now(), current: false }]);
    toast(`${name} linked`, "ok");
  };

  const updateSettings: StoreShape["updateSettings"] = (patch) => setSettings((s) => ({ ...s, ...patch }));

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
      resolveApproval, toggleAgentEnforcement, setAgentStatus, toggleProvider,
      revokeDevice, addDevice, updateSettings, toast, dismissToast,
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
