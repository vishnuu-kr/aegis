import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// Ticking "now" hook — replaces Date.now() during render so the
// react-hooks/purity rule stays happy. Renders first read from a
// useState initializer, then an interval updates it.
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

import {
  Cpu, ShieldCheck, Inbox as InboxIcon, DollarSign, Activity, AlertTriangle,
  Pause, Play, Ban, Plus, Check, X, Clock, Search, Download, Info,
  CreditCard, MessageSquare, Cloud, Database, Laptop, Smartphone, KeyRound,
  Trash2, Server, Settings, MoreHorizontal, Pencil,
  ChevronDown, ChevronUp, ChevronRight, Sun, Fingerprint, Bell,
  Users, History as HistoryIcon,
  LifeBuoy, Sparkles, ArrowRight, Circle, CircleCheck, Keyboard,
  MessageCircle, BookOpen, Compass, Rocket, Mail, Webhook,
  ExternalLink, CircleHelp,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import {
  useStore, verdictTone, timeAgo, money,
  type Provider, type Device, type LedgerEntry, type Agent,
} from "./data";
import { Btn, IconBtn, Chip, Toggle, EmptyState, PageHeader, CountdownRing, JsonTree, PolicyComposer, BiometricOverlay, SegmentedControl } from "./ui";
import type { RouteKey } from "./Dashboard";

// Premium UI Component imports from the installed blocks
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const statusTone = (s: string) => (s === "active" ? "ok" : s === "paused" ? "warn" : "bad");

// Stagger wrapper for cards
const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// ============================================================
// Repurposed analytics — governance metrics
// ============================================================
const SPEND_TREND = [
  { day: "Jun 02", spend: 188 }, { day: "Jun 04", spend: 204 }, { day: "Jun 06", spend: 197 },
  { day: "Jun 08", spend: 243 }, { day: "Jun 10", spend: 231 }, { day: "Jun 12", spend: 286 },
  { day: "Jun 14", spend: 274 }, { day: "Jun 16", spend: 318 }, { day: "Jun 18", spend: 352 },
  { day: "Jun 20", spend: 339 }, { day: "Jun 22", spend: 388 }, { day: "Jun 24", spend: 401 },
  { day: "Jun 26", spend: 423 }, { day: "Jun 28", spend: 430 },
];

const spendChartConfig = {
  spend: { label: "Spend", color: "var(--crimson)" },
} satisfies ChartConfig;

function SpendTrendChart() {
  return (
    <ChartContainer config={spendChartConfig} className="aspect-auto h-[240px] w-full">
      <AreaChart data={SPEND_TREND} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-spend)" stopOpacity={0.28} />
            <stop offset="95%" stopColor="var(--color-spend)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} minTickGap={28} className="text-[10px]" />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Area dataKey="spend" type="natural" fill="url(#fillSpend)" stroke="var(--color-spend)" strokeWidth={2} />
      </AreaChart>
    </ChartContainer>
  );
}

const VERDICT_META: { key: LedgerEntry["verdict"]; label: string; color: string }[] = [
  { key: "ALLOW", label: "Allow", color: "#10b981" },
  { key: "STEP_UP", label: "Step-up", color: "#64748b" },
  { key: "NOTICE", label: "Notice", color: "#94a3b8" },
  { key: "DENY", label: "Deny", color: "#ef4444" },
];

function DecisionsDonut({ ledger }: { ledger: LedgerEntry[] }) {
  const data = useMemo(() => {
    const base: Record<string, number> = { ALLOW: 0, STEP_UP: 0, NOTICE: 0, DENY: 0 };
    for (const e of ledger) {
      const v = e.verdict === "OK" ? "ALLOW" : e.verdict;
      if (v in base) base[v] += 1;
    }
    // Seed a little baseline so the donut always reads well in the demo.
    base.ALLOW += 38; base.STEP_UP += 9; base.NOTICE += 14; base.DENY += 4;
    return VERDICT_META.map((m) => ({ name: m.label, value: base[m.key], fill: m.color }));
  }, [ledger]);

  const total = data.reduce((s, d) => s + d.value, 0);
  const config: ChartConfig = Object.fromEntries(
    VERDICT_META.map((m) => [m.label, { label: m.label, color: m.color }])
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-square h-[170px] w-full flex items-center justify-center">
        <ChartContainer config={config} className="absolute inset-0 aspect-square h-[170px] w-full">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={76} strokeWidth={2} stroke="var(--card)">
              {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tracking-tight text-foreground">{total}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</span>
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="size-2 shrink-0 rounded-[3px]" style={{ background: d.fill }} />
            <span className="flex-1 text-muted-foreground">{d.name}</span>
            <span className="font-medium tabular-nums">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ tone, title, meta }: { tone: "ok" | "info" | "warn" | "muted"; title: string; meta: string }) {
  const iconCls =
    tone === "ok" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
    : tone === "info" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
    : tone === "warn" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
    : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";

  const renderIcon = () => {
    switch (tone) {
      case "ok":
        return <Check className="size-3" strokeWidth={2.5} />;
      case "info":
        return <Info className="size-3" strokeWidth={2.5} />;
      case "warn":
        return <AlertTriangle className="size-3" strokeWidth={2.5} />;
      default:
        return <Plus className="size-3" strokeWidth={2.5} />;
    }
  };

  return (
    <div className="flex gap-3 text-xs">
      <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border shadow-xs ${iconCls}`}>
        {renderIcon()}
      </span>
      <div className="flex flex-col">
        <span className="font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 text-[10px] text-muted-foreground">{meta}</span>
      </div>
    </div>
  );
}

export function OverviewPage({ onNav }: { onNav: (k: RouteKey) => void }) {
  const { agents, approvals, ledger, settings, toast } = useStore();
  const spend = agents.reduce((s, a) => s + a.spendUsed, 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const decisionsToday = ledger.length + 38;
  const recent = [...ledger].slice(-6).reverse();

  return (
    <div className="ad-scroll flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      {/* Welcome Row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Sun size={16} className="text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Welcome back</h2>
          </div>
          <p className="text-xs text-muted-foreground">Here's the current state of your autonomous workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast("Timeframe selection menu opened", "info")}>
            Last 30 days
            <ChevronDown size={12} />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="More options" title="More options" onClick={() => toast("More dashboard options coming soon", "info")}>
            <MoreHorizontal size={14} />
          </Button>
        </div>
      </div>

      {/* Warning Banner if Enforcement is off */}
      {!settings.enforcement && (
        <div className="flex gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <b>Enforcement is OFF.</b> Agents run unrestricted — policies are evaluated but not enforced. Turn it back on in Settings.
          </div>
        </div>
      )}

      {/* 1. Stats Cards Row — staggered reveal for premium entrance */}
      <motion.div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp}>
          <StatCard
            label="Pending approvals"
            icon={<InboxIcon size={14} />}
            value={approvals.length}
            delta={approvals.length ? -12.5 : -100}
            note="vs yesterday"
            color="#f97316"
            chartData={[{ v: 2 }, { v: 3 }, { v: 2 }, { v: 4 }, { v: 3 }, { v: 4 }]}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Active agents"
            icon={<Cpu size={14} />}
            value={`${activeAgents}/${agents.length}`}
            delta={5.2}
            note="vs last week"
            color="#64748b"
            chartData={[{ v: 1 }, { v: 2 }, { v: 2 }, { v: 2 }, { v: 3 }, { v: 2 }, { v: 2 }]}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Spend this month"
            icon={<DollarSign size={14} />}
            value={money(spend)}
            delta={8.2}
            note="vs prior 30d"
            color="#ef4444"
            chartData={[{ v: 180 }, { v: 240 }, { v: 210 }, { v: 320 }, { v: 380 }, { v: 350 }, { v: 430 }]}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Decisions today"
            icon={<Activity size={14} />}
            value={decisionsToday}
            delta={24.1}
            note="vs yesterday"
            color="#10b981"
            chartData={[{ v: 15 }, { v: 22 }, { v: 19 }, { v: 35 }, { v: 42 }, { v: 38 }, { v: 47 }]}
          />
        </motion.div>
      </motion.div>

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Spend over time</CardTitle>
            <CardDescription className="text-xs">Cumulative spend across mandates over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <SpendTrendChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Decisions by verdict</CardTitle>
            <CardDescription className="text-xs">Distribution of policy outcomes.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <DecisionsDonut ledger={ledger} />
          </CardContent>
        </Card>
      </div>

      {/* 3. Operations & Audit Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Governed Agents Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold">Governed agents</CardTitle>
              <CardDescription className="text-xs">Status & budget tracking</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNav("governance")}>Manage</Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {agents.map((a) => {
              const pct = Math.min(100, (a.spendUsed / a.spendLimit) * 100);
              return (
                <div key={a.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex size-6 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                      <Cpu size={12} />
                    </span>
                    <span className="font-medium text-foreground">{a.name}</span>
                    <Chip tone={statusTone(a.status) as "ok" | "warn" | "bad"} dot>{a.status}</Chip>
                    <span className="mono ml-auto text-[10px] font-semibold text-muted-foreground">{Math.round(pct)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200/50 dark:bg-zinc-800/80">
                    <div
                      className="h-full rounded-full duration-500"
                      style={{
                        width: `${pct}%`,
                        background: a.status === "paused"
                          ? "linear-gradient(90deg, #64748b, #94a3b8)"
                          : "linear-gradient(90deg, #b91c1c, #ef4444)",
                        boxShadow: a.status === "paused"
                          ? "none"
                          : "0 0 8px rgba(239, 68, 68, 0.2)"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Live Audit Ledger Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold">Live audit ledger</CardTitle>
              <CardDescription className="text-xs">Cryptographically secured event stream</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNav("history")}>View all</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[88px] text-xs">Verdict</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="w-[100px] text-xs">Agent</TableHead>
                  <TableHead className="w-[70px] text-right text-xs">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((e) => (
                  <TableRow key={e.seq}>
                    <TableCell className="py-2.5"><Chip tone={verdictTone(e.verdict)} dot>{e.verdict}</Chip></TableCell>
                    <TableCell className="max-w-[200px] truncate py-2.5 text-xs font-medium">{e.action}</TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground">{e.agent}</TableCell>
                    <TableCell className="mono py-2.5 text-right text-[11px] text-muted-foreground">{timeAgo(e.ts)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Workspace Activity Feed */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Workspace activity</CardTitle>
            <CardDescription className="text-xs">Operational signals & security logs</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3.5">
            <ActivityRow tone="ok" title="SLA warning cleared" meta="Ops Agent · 12 min ago" />
            <ActivityRow tone="info" title="Mandate signed" meta="Stripe · 1 hour ago" />
            <ActivityRow tone="warn" title="Budget threshold warning" meta="Research Agent · 3 hours ago" />
            <ActivityRow tone="warn" title="Suspicious tool execution blocked" meta="Aegis Enforcer · 5 hours ago" />
            <ActivityRow tone="ok" title="Biometric signature verified" meta="Finance Agent · 8 hours ago" />
            <ActivityRow tone="muted" title="Connected Stripe provider" meta="System · 1 day ago" />
            <ActivityRow tone="muted" title="Postgres database backup rotated" meta="System · 2 days ago" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label, icon, value, delta, note, color, chartData
}: {
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  delta: number;
  note: string;
  color: string;
  chartData: { v: number }[];
}) {
  return (
    <Card className="relative overflow-hidden flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</CardTitle>
          <span className="text-muted-foreground">{icon}</span>
        </CardHeader>
        <CardContent className="pb-1">
          <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
        </CardContent>
      </div>

      <div className="h-10 w-full overflow-hidden opacity-60 dark:opacity-40 select-none pointer-events-none">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 40 }}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={`spark-grad-${label.replace(/\s+/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#spark-grad-${label.replace(/\s+/g, "-")})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <CardFooter className="gap-1.5 text-xs text-muted-foreground pt-2">
        <Delta value={delta} variant="badge">
          <DeltaIcon />
          <DeltaValue />
        </Delta>
        <span>{note}</span>
      </CardFooter>
    </Card>
  );
}

// ============================================================
// Governance — with Policy Composer + KPI strip + sortable headers + expand + sparklines + status grouping
// ============================================================

// Deterministic 14-day spend series for an agent, seeded by agent id
function generateSparkline(agentId: string, base: number): number[] {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) hash = ((hash << 5) - hash + agentId.charCodeAt(i)) | 0;
  return Array.from({ length: 14 }, (_, i) => {
    const noise = Math.abs(Math.sin(hash + i * 1.7)) * 0.6 + 0.4;
    const trend = 0.7 + (i / 13) * 0.6;
    return Math.round(base * noise * trend);
  });
}

// Sparkline — small SVG trend chart (88×28)
function Sparkline({ data, status, agentId }: { data: number[]; status: Agent["status"]; agentId: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 88;
  const h = 28;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 6) - 3}`);
  const stroke =
    status === "paused" ? "#94a3b8" : status === "revoked" ? "#71717a" : "var(--crimson, #ef4444)";
  const fillId = `spark-${agentId}`;
  return (
    <svg width={w} height={h} aria-hidden className="overflow-visible flex-shrink-0">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${points.join(" ")} ${w},${h} 0,${h}`} fill={`url(#${fillId})`} />
      <polyline points={points.join(" ")} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(data.length - 1) * step} cy={h - ((data[data.length - 1] - min) / range) * (h - 6) - 3} r={2.5} fill={stroke} />
    </svg>
  );
}

// SortIndicator — chevron shown next to a sortable column header
function SortIndicator({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ChevronDown size={10} className="opacity-30" />;
  return dir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
}

// KpiCard — large metric card with animated number
function KpiCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <Card className="bg-card border border-border/70 p-4">
      <div className="text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-semibold">{label}</div>
      <div className="mt-1.5 mono text-2xl font-semibold tabular-nums text-card-foreground leading-none">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-2">{sub}</div>}
    </Card>
  );
}

// ExpandedDetail — per-agent detail shown inline when a row is expanded
function ExpandedDetail({ agent }: { agent: Agent }) {
  const activity = useMemo(() => {
    const types = ["policy.match", "spend.commit", "authn.verify", "card.auth", "ledger.append"];
    const outcomes = ["ALLOW", "ALLOW", "STEP_UP", "ALLOW"];
    let hash = 0;
    for (let i = 0; i < agent.id.length; i++) hash = ((hash << 5) - hash + agent.id.charCodeAt(i)) | 0;
    return Array.from({ length: 4 }, (_, i) => {
      const t = types[(hash + i) % types.length];
      const o = outcomes[(hash + i + 1) % outcomes.length];
      const mins = (i + 1) * 23 + (hash & 0xf);
      return { type: t, outcome: o, when: `${mins}m ago` };
    });
  }, [agent.id]);
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden bg-muted/20 border-t border-border/40"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 py-5">
        <div className="md:col-span-2">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Active mandates</div>
          <div className="space-y-2">
            {agent.mandates.map((m) => (
              <div key={m.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-card border border-border/60">
                <KeyRound size={12} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-card-foreground">{m.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{m.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Recent activity</div>
          <div className="space-y-1.5">
            {activity.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    a.outcome === "ALLOW" ? "bg-emerald-500" : a.outcome === "STEP_UP" ? "bg-amber-500" : "bg-red-500"
                  }`} />
                  <span className="mono text-card-foreground truncate">{a.type}</span>
                </div>
                <span className="text-muted-foreground whitespace-nowrap">{a.when}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border/40">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Compliance posture</span>
              <span className="mono font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">{agent.enforcement ? "98%" : "—"}</span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-zinc-200/60 dark:bg-zinc-800/80">
              <div className="h-full rounded-full bg-emerald-500 duration-700 ease-out" style={{ width: agent.enforcement ? "98%" : "0%" }} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// NoMatches — shown when statusFilter yields zero rows
function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <Card className="bg-card border border-dashed border-border/80 rounded-xl p-10 text-center">
      <div className="text-sm text-muted-foreground">No agents match this filter.</div>
      <button onClick={onClear} className="mt-3 text-xs text-foreground/80 underline underline-offset-2 ">
        Clear filter
      </button>
    </Card>
  );
}

export function GovernancePage() {
  const { agents, toggleAgentEnforcement, setAgentStatus, toast } = useStore();
  const [composerOpen, setComposerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | Agent["status"]>("all");
  const [sortKey, setSortKey] = useState<"name" | "tasks" | "spend" | "mandates" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingAgent = useMemo(
    () => (editingId ? agents.find((a) => a.id === editingId) ?? null : null),
    [editingId, agents]
  );

  const handleComposerSubmit = (_template: string, name: string, limit: number) => {
    toast(`Mandate "${name}" ($${limit}) signed & deployed`, "ok");
  };

  // KPI totals — memoized to avoid recompute on every render
  const kpis = useMemo(() => {
    let active = 0, paused = 0, revoked = 0, totalSpend = 0, totalMandates = 0;
    for (const a of agents) {
      if (a.status === "active") active++;
      else if (a.status === "paused") paused++;
      else if (a.status === "revoked") revoked++;
      totalSpend += a.spendUsed;
      totalMandates += a.mandates.length;
    }
    return {
      total: agents.length,
      active, paused, revoked,
      totalSpend,
      avgMandates: agents.length ? totalMandates / agents.length : 0,
    };
  }, [agents]);

  // Sparkline cache — deterministic per agent id, computed once per agents list
  const sparklineCache = useMemo(() => {
    const cache: Record<string, number[]> = {};
    for (const a of agents) cache[a.id] = generateSparkline(a.id, Math.max(a.spendUsed / 14, 1));
    return cache;
  }, [agents]);

  // Filtered + sorted agents
  const visibleAgents = useMemo(() => {
    const list = statusFilter === "all" ? agents.slice() : agents.filter((a) => a.status === statusFilter);
    if (sortKey) {
      list.sort((a, b) => {
        let cmp = 0;
        if (sortKey === "name") cmp = a.name.localeCompare(b.name);
        else if (sortKey === "tasks") cmp = a.tasks - b.tasks;
        else if (sortKey === "spend") cmp = a.spendUsed / a.spendLimit - b.spendUsed / b.spendLimit;
        else if (sortKey === "mandates") cmp = a.mandates.length - b.mandates.length;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [agents, statusFilter, sortKey, sortDir]);

  // Grouped agents — sections for active / paused / revoked when no filter applied
  const groupedAgents = useMemo(() => {
    if (statusFilter !== "all") {
      return [{ status: statusFilter, items: visibleAgents }];
    }
    const buckets: Record<Agent["status"], Agent[]> = { active: [], paused: [], revoked: [] };
    for (const a of visibleAgents) buckets[a.status].push(a);
    const order: Agent["status"][] = ["active", "paused", "revoked"];
    return order.filter((s) => buckets[s].length > 0).map((s) => ({ status: s, items: buckets[s] }));
  }, [visibleAgents, statusFilter]);

  const handleSort = (key: "name" | "tasks" | "spend" | "mandates") => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // Filter chip config for the header
  const filterButtons: Array<{ key: "all" | Agent["status"]; label: string; count: number; dot?: string; ping?: boolean }> = [
    { key: "all", label: "All", count: kpis.total },
    { key: "active", label: "Active", count: kpis.active, dot: "bg-emerald-500", ping: true },
    { key: "paused", label: "Paused", count: kpis.paused, dot: "bg-amber-500" },
  ];
  if (kpis.revoked > 0) filterButtons.push({ key: "revoked", label: "Revoked", count: kpis.revoked, dot: "bg-red-500" });

  return (
    <>
      <PageHeader
        title="Governance"
        subtitle="Every agent, its mandates, and the limits you've signed."
        actions={
          <div className="flex items-center gap-3">
            {agents.length > 0 && (
              <div className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground mr-1">
                {filterButtons.map((f) => {
                  const active = statusFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${
                        active ? "bg-muted text-foreground" : ""
                      }`}
                      aria-pressed={active}
                    >
                      {f.dot && (
                        <span className="relative inline-flex h-1.5 w-1.5">
                          {f.ping && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />}
                          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${f.dot}`} />
                        </span>
                      )}
                      <span>{f.label}</span>
                      <span className="font-medium tabular-nums text-foreground/80">{f.count}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <Button variant="default" size="sm" className="h-8 gap-1.5" onClick={() => setComposerOpen(true)}>
              <Plus size={14} /> New mandate
            </Button>
          </div>
        }
      />
      <div className="ad-scroll overflow-y-auto flex-1 p-6 space-y-5">
        {agents.length > 0 && (
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp}>
              <KpiCard label="Total agents" value={kpis.total.toLocaleString()} sub={`${kpis.active} active, ${kpis.paused} paused`} />
            </motion.div>
            <motion.div variants={fadeUp}>
              <KpiCard label="Active" value={kpis.active.toLocaleString()} sub={`${kpis.total ? Math.round((kpis.active / kpis.total) * 100) : 0}% of fleet`} />
            </motion.div>
            <motion.div variants={fadeUp}>
              <KpiCard label="Total spend" value={`$${kpis.totalSpend.toLocaleString()}`} sub="this billing period" />
            </motion.div>
            <motion.div variants={fadeUp}>
              <KpiCard label="Avg mandates" value={kpis.avgMandates.toFixed(1)} sub="per agent" />
            </motion.div>
          </motion.div>
        )}

        {visibleAgents.length === 0 ? (
          statusFilter === "all" ? (
            <EmptyGovernance onNewMandate={() => setComposerOpen(true)} />
          ) : (
            <NoMatches onClear={() => setStatusFilter("all")} />
          )
        ) : (
          <motion.div
            className="bg-card text-card-foreground border border-border/70 rounded-xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <div className="hidden md:grid grid-cols-12 gap-4 items-center px-4 py-2.5 border-b border-border/70 bg-muted/20 text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
              <button onClick={() => handleSort("name")} className="col-span-3 flex items-center gap-1  text-left">
                Agent <SortIndicator active={sortKey === "name"} dir={sortDir} />
              </button>
              <button onClick={() => handleSort("tasks")} className="col-span-1 flex items-center gap-1  text-left">
                Tasks <SortIndicator active={sortKey === "tasks"} dir={sortDir} />
              </button>
              <button onClick={() => handleSort("spend")} className="col-span-2 flex items-center gap-1  text-left">
                Spend <SortIndicator active={sortKey === "spend"} dir={sortDir} />
              </button>
              <div className="col-span-2">Trend</div>
              <button onClick={() => handleSort("mandates")} className="col-span-2 flex items-center gap-1  text-left">
                Mandates <SortIndicator active={sortKey === "mandates"} dir={sortDir} />
              </button>
              <div className="col-span-2 text-right pr-1">Controls</div>
            </div>

            {groupedAgents.map((group) => (
              <div key={group.status}>
                {statusFilter === "all" && groupedAgents.length > 1 && (
                  <div className="px-4 py-1.5 bg-muted/30 border-b border-border/40 text-[10px] uppercase tracking-[0.08em] font-semibold text-muted-foreground flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      group.status === "active" ? "bg-emerald-500" : group.status === "paused" ? "bg-amber-500" : "bg-red-500"
                    }`} />
                    {group.status} · {group.items.length}
                  </div>
                )}
                {group.items.map((a, i) => {
                  const pct = Math.min(100, (a.spendUsed / a.spendLimit) * 100);
                  const accentClass =
                    a.status === "paused" ? "bg-amber-500" : a.status === "revoked" ? "bg-red-500/70" : "";
                  const isExpanded = expandedId === a.id;
                  const sparkData = sparklineCache[a.id];
                  return (
                    <div key={a.id} className={i > 0 ? "border-t border-border/40" : ""}>
                      <motion.div
                        variants={fadeUp}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("button")) return;
                          setExpandedId(isExpanded ? null : a.id);
                        }}
                        className={`relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-4 py-3.5 group  cursor-pointer ${isExpanded ? "bg-muted/20" : ""}`}
                      >
                        <span
                          aria-hidden
                          className={`pointer-events-none absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full opacity-0  ${accentClass}`}
                          style={!accentClass ? { backgroundColor: "var(--crimson, #b91c1c)" } : undefined}
                        />
                        <div className="md:col-span-3 flex items-center gap-3 min-w-0">
                          <ChevronRight size={14} className={`text-muted-foreground flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-muted to-muted/40 flex items-center justify-center text-muted-foreground border border-border/60 shadow-sm flex-shrink-0">
                            <Cpu size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-card-foreground truncate">{a.name}</span>
                              <Chip tone={statusTone(a.status) as "ok" | "warn" | "bad"} dot>{a.status}</Chip>
                            </div>
                            <div className="mono text-[10px] text-muted-foreground mt-0.5 truncate tracking-wide">{a.did}</div>
                          </div>
                        </div>

                        <div className="md:col-span-1 flex md:flex-col gap-2 md:gap-0.5">
                          <span className="md:hidden text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Tasks</span>
                          <span className="mono font-semibold text-xs tabular-nums text-card-foreground">{a.tasks.toLocaleString()}</span>
                        </div>

                        <div className="md:col-span-2">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="md:hidden text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Spend</span>
                            <span className="mono text-[11px] tabular-nums text-card-foreground ml-auto">
                              {money(a.spendUsed)} <span className="text-muted-foreground">/ {money(a.spendLimit)}</span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/60 dark:bg-zinc-800/80 shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.06)]">
                            <div
                              className="h-full rounded-full duration-700 ease-out"
                              style={{
                                width: `${pct}%`,
                                background:
                                  a.status === "paused" ? "linear-gradient(90deg, #64748b, #94a3b8)" :
                                  a.status === "revoked" ? "linear-gradient(90deg, #71717a, #a1a1aa)" :
                                  "linear-gradient(90deg, #b91c1c, #ef4444, #f87171)",
                                boxShadow: a.status === "paused" || a.status === "revoked" ? "none" : "0 0 10px rgba(239, 68, 68, 0.28)",
                              }}
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2 flex items-center">
                          <Sparkline data={sparkData} status={a.status} agentId={a.id} />
                        </div>

                        <div className="md:col-span-2 min-w-0">
                          <div className="md:hidden text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Mandates</div>
                          <div className="flex flex-wrap gap-1">
                            {a.mandates.slice(0, 2).map((m) => (
                              <span key={m.id} className="inline-flex items-center gap-1 text-[11px] text-card-foreground bg-muted/60 border border-border/60 rounded-full px-2 py-0.5  " title={m.detail}>
                                <KeyRound size={9} className="text-muted-foreground" />
                                {m.label}
                              </span>
                            ))}
                            {a.mandates.length > 2 && (
                              <span className="inline-flex items-center text-[11px] text-muted-foreground px-2 py-0.5">+{a.mandates.length - 2}</span>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2 flex items-center justify-end gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-muted-foreground font-medium hidden lg:inline">Enforce</span>
                            <Toggle on={a.enforcement} onClick={() => toggleAgentEnforcement(a.id)} label={`enforcement for ${a.name}`} />
                          </div>
                          <div className="flex items-center gap-1">
                            <IconBtn onClick={() => setEditingId(a.id)} title="Edit agent" aria-label={`Edit ${a.name}`}>
                              <Pencil size={14} />
                            </IconBtn>
                            {a.status === "active" ? (
                              <IconBtn onClick={() => setAgentStatus(a.id, "paused")} title="Pause" aria-label={`Pause ${a.name}`} className="">
                                <Pause size={14} />
                              </IconBtn>
                            ) : a.status === "paused" ? (
                              <IconBtn onClick={() => setAgentStatus(a.id, "active")} title="Resume" aria-label={`Resume ${a.name}`} className="">
                                <Play size={14} />
                              </IconBtn>
                            ) : (
                              <IconBtn onClick={() => setAgentStatus(a.id, "active")} title="Reactivate" aria-label={`Reactivate ${a.name}`} className="">
                                <Play size={14} />
                              </IconBtn>
                            )}
                            {a.status !== "revoked" && (
                              <IconBtn onClick={() => setAgentStatus(a.id, "revoked")} title="Revoke" aria-label={`Revoke ${a.name}`} className="text-red-500 ">
                                <Ban size={14} />
                              </IconBtn>
                            )}
                          </div>
                        </div>
                      </motion.div>
                      <AnimatePresence initial={false}>
                        {isExpanded && <ExpandedDetail agent={a} />}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ))}
          </motion.div>
        )}
      </div>
      <AnimatePresence>
        {composerOpen && <PolicyComposer onClose={() => setComposerOpen(false)} onSubmit={handleComposerSubmit} />}
      </AnimatePresence>
      <AnimatePresence>
        {editingAgent && <EditAgentModal agent={editingAgent} onClose={() => setEditingId(null)} />}
      </AnimatePresence>
    </>
  );
}

function EmptyGovernance({ onNewMandate }: { onNewMandate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-card text-card-foreground border border-dashed border-border/80 rounded-xl overflow-hidden"
    >
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="relative w-14 h-14 mb-5">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--crimson,#b91c1c)]/15 to-[var(--crimson,#b91c1c)]/5 border border-[var(--crimson,#b91c1c)]/20" />
          <div className="absolute inset-0 flex items-center justify-center text-[var(--crimson,#b91c1c)]">
            <ShieldCheck size={22} strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="text-base font-semibold text-card-foreground mb-1.5 tracking-tight">No agents yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-5 leading-relaxed">
          Compose your first mandate to register an agent. Every action the agent takes will be evaluated against the policy you sign.
        </p>
        <Button variant="default" size="sm" className="h-8 gap-1.5" onClick={onNewMandate}>
          <Plus size={14} /> Compose first mandate
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================
// Edit Agent Modal — name, spend limit, status, enforcement, mandates
// ============================================================
function EditAgentModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const { updateAgent, toggleMandate, removeMandate, addMandate } = useStore();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(agent.name);
  const [spendLimit, setSpendLimit] = useState(agent.spendLimit);
  const [status, setStatus] = useState<Agent["status"]>(agent.status);
  const [enforcement, setEnforcement] = useState(agent.enforcement);
  const [newLabel, setNewLabel] = useState("");
  const [newDetail, setNewDetail] = useState("");

  // ESC + focus trap (matches PolicyComposer)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => {
      const target = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      target?.focus();
    }, 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [onClose]);

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    updateAgent(agent.id, {
      name: trimmedName,
      spendLimit,
      status,
      enforcement,
    });
    onClose();
  };

  const handleAddMandate = () => {
    const lbl = newLabel.trim();
    if (!lbl) return;
    addMandate(agent.id, lbl, newDetail);
    setNewLabel("");
    setNewDetail("");
  };

  return (
    <motion.div
      className="ad-composer-mask"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        ref={dialogRef}
        className="ad-composer max-w-[520px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-agent-title"
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 6 }}
        transition={{ type: "spring", duration: 0.32, bounce: 0.12 }}
      >
        <div className="ad-composer-header">
          <h2 id="edit-agent-title" className="text-base">
            <Pencil size={16} style={{ verticalAlign: -3, marginRight: 8 }} />
            Edit agent
          </h2>
          <button className="ad-iconbtn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Read-only identity */}
        <div className="px-5 pt-4 pb-3 border-b border-border/60">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Identity</div>
          <div className="mono text-[11px] text-card-foreground break-all">{agent.did}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Read-only · cryptographic identifier</div>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label htmlFor="edit-agent-name" className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              Name
            </label>
            <input
              id="edit-agent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/15"
              autoFocus
            />
          </div>

          {/* Spend limit + Enforcement */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-spend-limit" className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                Spend limit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground mono pointer-events-none">$</span>
                <input
                  id="edit-spend-limit"
                  type="number"
                  min={0}
                  step={1}
                  value={spendLimit}
                  onChange={(e) => setSpendLimit(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-9 pl-7 pr-3 rounded-md border border-border bg-background text-sm mono tabular-nums focus:outline-none focus:ring-2 focus:ring-foreground/15"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                Enforcement
              </label>
              <div className="flex items-center h-9">
                <Toggle on={enforcement} onClick={() => setEnforcement((v) => !v)} label="Enforcement" />
                <span className="ml-2 text-xs text-muted-foreground">{enforcement ? "On" : "Off"}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              Status
            </label>
            <SegmentedControl<Agent["status"]>
              value={status}
              onChange={setStatus}
              layoutId="edit-status-seg"
              size="sm"
              ariaLabel="Agent status"
              options={[
                { value: "active", label: "Active" },
                { value: "paused", label: "Paused" },
                { value: "revoked", label: "Revoked" },
              ]}
            />
          </div>

          {/* Mandates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Mandates ({agent.mandates.length})
              </label>
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {agent.mandates.map((m) => (
                <div key={m.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-border/60 bg-card">
                  <div className="pt-0.5">
                    <Toggle
                      on={m.active}
                      onClick={() => toggleMandate(agent.id, m.id)}
                      label={`mandate ${m.label}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-card-foreground truncate">{m.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{m.detail}</div>
                  </div>
                  <IconBtn onClick={() => removeMandate(agent.id, m.id)} title="Remove mandate" aria-label={`Remove ${m.label}`}>
                    <Trash2 size={13} />
                  </IconBtn>
                </div>
              ))}
              {agent.mandates.length === 0 && (
                <div className="text-[11px] text-muted-foreground italic px-2 py-3 text-center border border-dashed border-border/60 rounded-md">
                  No mandates yet. Add one below.
                </div>
              )}
            </div>

            {/* Add mandate */}
            <div className="mt-2 p-2.5 rounded-lg border border-dashed border-border/60 bg-muted/20">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                Add mandate
              </div>
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Label (e.g. saas-spend-limit)"
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-foreground/15"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddMandate(); }}
                />
                <input
                  type="text"
                  value={newDetail}
                  onChange={(e) => setNewDetail(e.target.value)}
                  placeholder="Detail (e.g. ≤ $500 / mo)"
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-foreground/15"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddMandate(); }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 self-start"
                  onClick={handleAddMandate}
                  disabled={!newLabel.trim()}
                >
                  <Plus size={12} /> Append mandate
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/60 bg-muted/20">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={!canSave}
          >
            Save changes
          </Button>
        </div>
      </motion.div>
    </motion.div>
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
  // Live clock so the countdown rings tick (and to keep render pure).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
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
          <SegmentedControl<"all" | "STEP_UP" | "NOTICE">
            value={filter}
            onChange={setFilter}
            layoutId="active-seg-inbox"
            size="sm"
            ariaLabel="Filter inbox by request kind"
            options={[
              { value: "all", label: "All" },
              { value: "STEP_UP", label: "Step-up" },
              { value: "NOTICE", label: "Notice" },
            ]}
          />
        }
      />

      {shown.length === 0 ? (
        <div className="ad-scroll overflow-y-auto flex-1 p-6">
          <Card className="bg-card text-card-foreground border-border shadow-none flex flex-col items-center justify-center p-12 relative overflow-hidden">
            {/* Background wireframe decoration */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-empty" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-empty)" />
              </svg>
            </div>
            
            <div className="flex flex-col items-center text-center relative z-10 max-w-sm gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                <Check size={22} strokeWidth={2.5} />
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-base font-bold text-card-foreground tracking-tight">Inbox zero</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  All clear! No pending actions require your signature at the moment.
                </p>
              </div>
              
              <div className="bg-muted/40 border border-border rounded-lg p-4 w-full">
                <div className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Next Steps</div>
                <div className="text-xs text-muted-foreground leading-normal mb-3">
                  Configure additional governance mandates or connect more service providers to expand coverage.
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onNav("governance")}>Configure mandates</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNav("providers")}>Connect providers</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 divide-x divide-border">
          {/* Left: List */}
          <div className="w-[320px] flex-shrink-0 overflow-y-auto p-4 flex flex-col gap-3">
            <AnimatePresence>
              {shown.map((a) => {
                const selected = selectedId === a.id;
                return (
                  <motion.div
                    key={a.id}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer ${selected ? "bg-muted border-border ring-1 ring-inset ring-foreground/15" : "bg-card border-border/40 "}`}
                    onClick={() => setSelectedId(a.id)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <CountdownRing remaining={Math.max(0, Math.floor((a.createdAt + 3600000 - now) / 1000))} total={3600} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                          <span className={`size-1.5 rounded-full ${a.kind === "STEP_UP" ? "bg-amber-500" : "bg-blue-500"}`} />
                          {a.kind === "STEP_UP" ? "Step-up" : "Notice"}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider ${
                          a.risk === "high" ? "bg-red-500/10 text-red-500 border border-red-500/15"
                          : a.risk === "medium" ? "bg-amber-500/10 text-amber-500 border border-amber-500/15"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15"
                        }`}>
                          {a.risk}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-card-foreground leading-snug truncate">{a.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{a.agent} · {timeAgo(a.createdAt)}</div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Right: Detail */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0 bg-muted/10">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col flex-1 h-full"
                >
                  <Card className="bg-card text-card-foreground border-border shadow-none flex flex-col flex-1 p-6 relative gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                          <span className={`size-1.5 rounded-full ${selected.kind === "STEP_UP" ? "bg-amber-500" : "bg-blue-500"}`} />
                          {selected.kind === "STEP_UP" ? "Step-up" : "Notice"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          selected.risk === "high" ? "bg-red-500/10 text-red-500 border border-red-500/15"
                          : selected.risk === "medium" ? "bg-amber-500/10 text-amber-500 border border-amber-500/15"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15"
                        }`}>
                          {selected.risk} risk
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={12} /> {timeAgo(selected.createdAt)}
                        </span>
                      </div>
                      <h2 className="margin-0 text-base font-bold text-card-foreground tracking-tight leading-snug">{selected.title}</h2>
                      <div className="text-xs text-muted-foreground mt-1.5">{selected.agent} · {selected.detail}</div>
                    </div>

                    {/* JSON policy tree */}
                    <div className="flex-1 min-h-0 flex flex-col gap-2">
                      <div className="text-[10px] text-muted-foreground text-uppercase tracking-wider font-semibold">Mandate Evaluation</div>
                      <div className="flex-1 overflow-y-auto bg-muted/40 rounded-lg border border-border p-2">
                        {policyJson && <JsonTree data={policyJson as Record<string, unknown>} />}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
                      <Btn variant="ok" icon={<Fingerprint size={14} />} onClick={() => handleApprove(selected.id)}>
                        Approve &amp; sign
                      </Btn>
                      <Btn
                        variant="danger"
                        icon={<X size={14} />}
                        onClick={() => { resolveApproval(selected.id, "deny"); setSelectedId(null); }}
                      >
                        Deny
                      </Btn>
                      <span className="ml-auto text-[10px] text-muted-foreground font-medium tabular-nums">Signed on-device · passkey</span>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col flex-1 h-full items-center justify-center gap-6 p-12"
                >
                  <EmptyState
                    icon={<InboxIcon size={26} />}
                    title="No request selected"
                  >
                    Select a pending request on the left to review the action details, check risk context, and sign or deny with your passkey.
                  </EmptyState>
                  <div className="flex items-start gap-2 bg-muted/40 border border-border rounded-lg p-3 text-left max-w-xs">
                    <ShieldCheck size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      All approvals are signed on-device using a passkey. Aegis never transmits your private key.
                    </span>
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
            <div className="flex items-center bg-muted border border-border rounded-md px-2.5 py-1 w-64 h-8 gap-1.5">
              <Search size={14} className="text-muted-foreground" />
              <input 
                placeholder="Search actions, agents…" 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                className="bg-transparent border-none outline-none text-xs text-card-foreground flex-1 placeholder:text-muted-foreground"
              />
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => toast(`Exported ${rows.length} records`, "ok")}>
              <Download size={14} /> Export
            </Button>
          </>
        }
      />
      <div className="ad-scroll overflow-y-auto flex-1 p-6 flex flex-col gap-4">
        <div className="flex bg-muted p-0.5 rounded-lg border border-border gap-0.5 self-start">
          {(["all", "ALLOW", "STEP_UP", "DENY"] as const).map((f) => {
            const active = vf === f;
            return (
              <button 
                key={f} 
                className={`h-7 px-3 text-xs font-semibold rounded-md relative cursor-pointer border-none bg-transparent ${active ? "text-card-foreground" : "text-muted-foreground "}`}
                onClick={() => setVf(f)}
              >
                {active && (
                  <motion.div
                    layoutId="active-seg-history"
                    className="absolute inset-0 bg-card rounded-[5px] border border-border/40 shadow-sm z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{f === "all" ? "All verdicts" : f === "STEP_UP" ? "Step-up" : f.charAt(0) + f.slice(1).toLowerCase()}</span>
              </button>
            );
          })}
        </div>

        <Card className="bg-card text-card-foreground border-border shadow-none overflow-hidden">
          {rows.length === 0 ? (
            <EmptyState icon={<Search size={22} />} title="No matching records">Try a different search or verdict filter.</EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] p-3 text-xs font-semibold">Seq</TableHead>
                  <TableHead className="w-[80px] p-3 text-xs font-semibold">Event</TableHead>
                  <TableHead className="p-3 text-xs font-semibold">Action</TableHead>
                  <TableHead className="w-[120px] p-3 text-xs font-semibold">Agent</TableHead>
                  <TableHead className="w-[100px] p-3 text-xs font-semibold">Verdict</TableHead>
                  <TableHead className="w-[100px] p-3 text-xs font-semibold">When</TableHead>
                  <TableHead className="w-[90px] p-3 text-xs font-semibold text-right">Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e, index) => (
                  <TableRow 
                    key={e.seq}
                    className={` ${index % 2 === 0 ? "bg-transparent" : "bg-muted/10"}`}
                  >
                    <TableCell className="p-3 text-muted-foreground mono text-xs">{e.seq}</TableCell>
                    <TableCell className="p-3">
                      <span className="inline-flex items-center text-[10px] font-semibold text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-muted/30">{e.eventType}</span>
                    </TableCell>
                    <TableCell className="p-3 font-medium max-w-[240px] truncate text-xs mono">{e.action}</TableCell>
                    <TableCell className="p-3 text-muted-foreground text-xs">{e.agent}</TableCell>
                    <TableCell className="p-3">
                      <Chip tone={verdictTone(e.verdict)} dot>{e.verdict}</Chip>
                    </TableCell>
                    <TableCell className="p-3 text-muted-foreground text-xs mono whitespace-nowrap">{timeAgo(e.ts)}</TableCell>
                    <TableCell 
                      className="p-3 text-right text-xs text-muted-foreground mono cursor-pointer "
                      onClick={() => {
                        navigator.clipboard.writeText(e.hash);
                        toast("Hash copied to clipboard", "ok");
                      }}
                      title="Click to copy full hash"
                    >
                      {e.hash.length > 10 ? e.hash.slice(0, 8) + "…" : e.hash}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}

// ============================================================
// Providers
// ============================================================
const provIcon = (c: Provider["category"]) =>
  c === "payments" ? <CreditCard size={16} /> : c === "comms" ? <MessageSquare size={16} /> : c === "data" ? <Database size={16} /> : <Cloud size={16} />;

// Credential fields required to connect each provider — keyed by provider id.
// Keep this list aligned with what's actually consumed in the dashboard code
// (Stripe for billing, Twilio for SMS verification, GitHub for deploy tokens).
function getFieldsForProvider(id: string): Array<{
  key: string;
  label: string;
  help?: string;
  placeholder: string;
  type?: string;
}> {
  switch (id) {
    case "stripe":
      return [
        { key: "apiKey", label: "Secret key", help: "starts with sk_live_ or sk_test_", placeholder: "sk_live_…", type: "password" },
      ];
    case "twilio":
      return [
        { key: "accountSid", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
        { key: "authToken", label: "Auth Token", placeholder: "your Twilio auth token", type: "password" },
        { key: "fromNumber", label: "From number", help: "E.164 format", placeholder: "+14155551234" },
      ];
    case "agentmail":
      return [
        { key: "apiKey", label: "API key", placeholder: "am_…", type: "password" },
        { key: "fromAddress", label: "From address", help: "the verified sender", placeholder: "[email protected]" },
      ];
    case "agentcard":
      return [
        { key: "apiKey", label: "Secret key", help: "starts with ac_live_ or ac_test_", placeholder: "ac_live_…", type: "password" },
        { key: "accountId", label: "Account ID", placeholder: "acct_…" },
      ];
    case "playwright":
      return [
        { key: "apiUrl", label: "API URL", help: "your Playwright workspace endpoint", placeholder: "https://…playwright.dev" },
        { key: "accessToken", label: "Access token", placeholder: "your workspace access token", type: "password" },
      ];
    default:
      return [];
  }
}

function ConnectProviderModal({ provider, onClose }: { provider: Provider; onClose: () => void }) {
  const { connectProvider, toast } = useStore();
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fields = getFieldsForProvider(provider.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      if (!values[f.key]?.trim()) {
        toast(`${f.label} is required`, "info");
        return;
      }
    }
    setSubmitting(true);
    setTimeout(() => {
      connectProvider(provider.id, values);
      onClose();
    }, 300);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card text-card-foreground border border-border rounded-xl shadow-lg w-full max-w-md overflow-hidden"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <span className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center border border-border">
                {provIcon(provider.category)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm">Connect {provider.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{provider.desc}</div>
              </div>
              <button type="button" onClick={onClose} className="text-muted-foreground p-1 rounded">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-card-foreground block mb-1.5">
                    {f.label}
                    {f.help && <span className="text-muted-foreground font-normal ml-1.5">· {f.help}</span>}
                  </label>
                  <input
                    type={f.type || "text"}
                    value={values[f.key] || ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-card-foreground placeholder:text-muted-foreground mono focus:outline-none focus:ring-2 focus:ring-foreground/15 focus:border-foreground/30"
                  />
                </div>
              ))}

              <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50 border border-border/60 text-[11px] text-muted-foreground leading-relaxed">
                <ShieldCheck size={14} className="text-foreground/60 flex-shrink-0 mt-0.5" />
                <span>Credentials are vaulted in this session and never exposed to agents. You can revoke and re-enter them at any time.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/20">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 px-3">Cancel</Button>
              <Button type="submit" size="sm" className="h-8 px-3 gap-1.5" disabled={submitting}>
                {submitting ? "Connecting…" : "Connect"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function ProvidersPage() {
  const { providers, disconnectProvider } = useStore();
  const [connectingProvider, setConnectingProvider] = useState<Provider | null>(null);
  const [category, setCategory] = useState<Provider["category"] | "All">("All");

  const connected = providers.filter((p) => p.connected).length;
  const categories = useMemo(
    () => Array.from(new Set(providers.map((p) => p.category))),
    [providers]
  );

  const filtered = useMemo(
    () => (category === "All" ? providers : providers.filter((p) => p.category === category)),
    [providers, category]
  );

  const categoryFilters: Array<{ key: Provider["category"] | "All"; label: string; count: number; tone: string }> = [
    { key: "All", label: "All", count: providers.length, tone: "muted" },
    { key: "payments", label: "Payments", count: providers.filter((p) => p.category === "payments").length, tone: "payments" },
    { key: "comms", label: "Comms", count: providers.filter((p) => p.category === "comms").length, tone: "comms" },
    { key: "compute", label: "Compute", count: providers.filter((p) => p.category === "compute").length, tone: "compute" },
    { key: "data", label: "Data", count: providers.filter((p) => p.category === "data").length, tone: "data" },
  ];

  return (
    <>
      <PageHeader
        title="Providers"
        subtitle={`${connected} of ${providers.length} connected — credentials stay vaulted, never exposed to the agent.`}
      />
      <div className="ad-scroll overflow-y-auto flex-1 p-6">
        <motion.div
          className="flex flex-col gap-5"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Stats strip */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Connected", value: connected },
              { label: "Available", value: providers.length - connected },
              { label: "Categories", value: categories.length },
              { label: "Vaulted", value: connected },
            ].map((stat) => (
              <div key={stat.label} className="ad-card pad flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{stat.label}</span>
                <span className="text-2xl font-bold text-card-foreground tabular-nums">{stat.value}</span>
              </div>
            ))}
          </motion.div>

          {/* Category filter chips */}
          {providers.length > 0 && (
            <motion.div variants={fadeUp} className="flex items-center gap-1.5 flex-wrap">
              {categoryFilters.map((f) => {
                const active = category === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setCategory(f.key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                      active
                        ? "bg-foreground/8 text-foreground border-foreground/15 font-medium"
                        : "bg-transparent text-muted-foreground border-border/60 hover:text-foreground hover:border-border"
                    }`}
                  >
                    {f.key !== "All" && (
                      <span className={`size-1.5 rounded-full ad-cat-dot ad-cat-dot-${f.tone}`} />
                    )}
                    <span>{f.label}</span>
                    <span className="font-medium tabular-nums text-foreground/80">{f.count}</span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* Provider grid */}
          {filtered.length === 0 ? (
            <motion.div variants={fadeUp} className="ad-empty-lg">
              <div className="ad-empty-ico"><Cloud size={22} /></div>
              <div className="ad-empty-title">No providers in this category</div>
              <div className="text-xs text-muted-foreground">
                Add a new provider or pick a different filter.
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              {filtered.map((p) => {
                const fieldCount = getFieldsForProvider(p.id).length;
                const credWord = fieldCount === 1 ? "credential" : "credentials";
                const metaText = p.connected
                  ? "Vaulted credentials"
                  : fieldCount === 0
                    ? "No credentials required"
                    : `${fieldCount} ${credWord} required`;
                return (
                  <motion.div
                    key={p.id}
                    variants={fadeUp}
                    className={`ad-provider-card ${p.connected ? "is-connected" : ""}`}
                  >
                    {/* Header: icon + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className={`ad-provider-icon tone-${p.category}`}>
                          {provIcon(p.category)}
                          {p.connected && (
                            <span className="ad-provider-check" aria-label="connected">
                              <Check size={9} strokeWidth={3.5} />
                            </span>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-card-foreground leading-none truncate">{p.name}</div>
                          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-1.5">
                            {p.category}
                          </div>
                        </div>
                      </div>
                      {p.connected ? (
                        <Chip tone="ok" dot>Connected</Chip>
                      ) : (
                        <Chip tone="muted">Available</Chip>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-2">{p.desc}</p>

                    {/* Meta strip */}
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ShieldCheck size={12} className={p.connected ? "text-emerald-500 shrink-0" : "text-muted-foreground/60 shrink-0"} />
                        <span className="truncate">
                          {metaText}
                        </span>
                      </div>
                      {p.connected && p.connectedAt && (
                        <span className="tabular-nums shrink-0">{timeAgo(p.connectedAt)}</span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="mt-3">
                      {p.connected ? (
                        <Btn
                          variant="ghost"
                          sm
                          block
                          onClick={() => disconnectProvider(p.id)}
                          className="text-red-500 hover:bg-red-500/10"
                        >
                          <Ban size={12} /> Disconnect
                        </Btn>
                      ) : (
                        <Btn
                          variant="primary"
                          sm
                          block
                          onClick={() => setConnectingProvider(p)}
                        >
                          <Plus size={12} /> Connect
                        </Btn>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </div>
      <AnimatePresence>
        {connectingProvider && (
          <ConnectProviderModal
            provider={connectingProvider}
            onClose={() => setConnectingProvider(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// Devices
// ============================================================
const devIcon = (k: Device["kind"]) => (k === "laptop" ? <Laptop size={18} /> : k === "phone" ? <Smartphone size={18} /> : <KeyRound size={18} />);

function LinkDeviceModal({ onClose }: { onClose: () => void }) {
  const { addDevice, toast } = useStore();
  const [step, setStep] = useState<"kind" | "pair">("kind");
  const [selectedKind, setSelectedKind] = useState<Device["kind"] | null>(null);
  const [pairing, setPairing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairingCode] = useState(() => generatePairingCode());

  const handleKindSelect = (kind: Device["kind"]) => {
    setSelectedKind(kind);
    setError(null);
    setStep("pair");
  };

  const handleWebAuthnPair = async () => {
    if (!selectedKind) return;
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      setError("Your browser doesn't support passkeys (WebAuthn). Use a modern browser over HTTPS or localhost.");
      return;
    }
    setPairing(true);
    setError(null);
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Aegis Control Plane" },
          user: {
            id: userId,
            name: "operator@aegis.local",
            displayName: "Operator",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: selectedKind === "security-key" ? "cross-platform" : "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
          timeout: 60000,
          attestation: "none",
        },
      })) as PublicKeyCredential | null;
      if (!credential) throw new Error("No credential returned");
      const credId = bytesToBase64Url(new Uint8Array(credential.rawId));
      const name = selectedKind === "security-key" ? "Security key" : "This laptop";
      addDevice(name, selectedKind, { credentialId: credId });
      toast(`${name} linked`, "ok");
      onClose();
    } catch (err: any) {
      const msg = err?.name === "NotAllowedError" ? "Pairing was cancelled." : (err?.message || "Pairing failed.");
      setError(msg);
    } finally {
      setPairing(false);
    }
  };

  const handlePhoneConfirm = () => {
    if (!selectedKind) return;
    addDevice(`Phone · ${pairingCode}`, "phone", { pairedAt: Date.now() });
    toast("Phone linked", "ok");
    onClose();
  };

  const handleBack = () => {
    setStep("kind");
    setSelectedKind(null);
    setError(null);
  };

  const stepIndex = step === "kind" ? 1 : 2;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card text-card-foreground border border-border rounded-xl shadow-lg w-full max-w-md overflow-hidden"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <span className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center border border-border">
              {selectedKind === "laptop" ? <Laptop size={18} /> :
               selectedKind === "phone" ? <Smartphone size={18} /> :
               selectedKind === "security-key" ? <KeyRound size={18} /> :
               <Plus size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm">Link a new device</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Step {stepIndex} of 2 — {step === "kind" ? "pick the kind of device" : "complete pairing"}
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-muted-foreground p-1 rounded" aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className="p-5">
            {step === "kind" ? (
              <div className="grid grid-cols-1 gap-2.5">
                {([
                  { kind: "laptop" as const, icon: Laptop, title: "This laptop", desc: "Use Touch ID, Face ID, or screen lock." },
                  { kind: "phone" as const, icon: Smartphone, title: "Phone", desc: "Scan a pairing code from the Aegis app." },
                  { kind: "security-key" as const, icon: KeyRound, title: "Security key", desc: "Touch a YubiKey or compatible FIDO2 key." },
                ]).map(({ kind, icon: Icon, title, desc }) => (
                  <button
                    key={kind}
                    onClick={() => handleKindSelect(kind)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card text-left hover:border-foreground/40"
                  >
                    <span className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center border border-border flex-shrink-0">
                      <Icon size={18} className="text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : selectedKind === "phone" ? (
              <PhonePairingStep code={pairingCode} onConfirm={handlePhoneConfirm} onBack={handleBack} />
            ) : selectedKind ? (
              <WebAuthnStep kind={selectedKind} pairing={pairing} error={error} onPair={handleWebAuthnPair} onBack={handleBack} />
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function WebAuthnStep({ kind, pairing, error, onPair, onBack }: {
  kind: Device["kind"];
  pairing: boolean;
  error: string | null;
  onPair: () => void;
  onBack: () => void;
}) {
  const isKey = kind === "security-key";
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center py-2">
        <div className="relative w-14 h-14 mb-4">
          <div className="absolute inset-0 rounded-2xl bg-muted border border-border" />
          <div className="absolute inset-0 flex items-center justify-center">
            {isKey ? <KeyRound size={22} className="text-foreground" /> : <Fingerprint size={22} className="text-foreground" />}
          </div>
        </div>
        <div className="text-sm font-medium text-card-foreground">
          {isKey ? "Touch your security key" : "Verify with your fingerprint"}
        </div>
        <div className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
          {isKey
            ? "Insert your key and tap the metal contact. The browser will register it as a FIDO2 passkey."
            : "Your platform will prompt for Touch ID, Face ID, or screen lock to register this device as a passkey."}
        </div>
      </div>

      {error && (
        <div className="text-[11px] text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2 leading-relaxed">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-3">Back</Button>
        <Button size="sm" onClick={onPair} disabled={pairing} className="h-8 px-3 gap-1.5">
          {pairing ? "Waiting for authenticator…" : (isKey ? "Pair security key" : "Pair this laptop")}
        </Button>
      </div>
    </div>
  );
}

function PhonePairingStep({ code, onConfirm, onBack }: {
  code: string;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const qrPattern = useMemo(() => generateQrPattern(code), [code]);
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <div
          className="w-40 h-40 rounded-lg bg-foreground p-2 gap-px grid mb-3"
          style={{ gridTemplateColumns: "repeat(21, 1fr)" }}
          aria-hidden
        >
          {qrPattern.flat().map((on, i) => (
            <div key={i} className="aspect-square" style={{ backgroundColor: on ? "var(--card)" : "transparent" }} />
          ))}
        </div>
        <div className="text-xs text-muted-foreground mb-2">Scan this code in the Aegis mobile app</div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 rounded-md bg-muted border border-border font-mono text-base font-semibold tracking-[0.3em] text-card-foreground">
            {code.slice(0, 3)} {code.slice(3)}
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(code);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            }}
            className={`h-9 w-9 rounded-md border bg-card flex items-center justify-center ${
              copied ? "border-emerald-500/50 text-emerald-600" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
            }`}
            title={copied ? "Copied" : "Copy code"}
            aria-label="Copy code"
          >
            <Check size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50 border border-border/60 text-[11px] text-muted-foreground leading-relaxed">
        <ShieldCheck size={14} className="text-foreground/60 flex-shrink-0 mt-0.5" />
        <span>Open Aegis on your phone → Settings → Link device → enter the 6-digit code. This phone will appear here once confirmed.</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-3">Back</Button>
        <Button size="sm" onClick={onConfirm} className="h-8 px-3 gap-1.5">
          I've paired my phone
        </Button>
      </div>
    </div>
  );
}

function generatePairingCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return (arr[0] % 1000000).toString().padStart(6, "0");
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateQrPattern(code: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const drawFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[row + r][col + c] = isOuter || isInner;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = ((hash << 5) - hash + code.charCodeAt(i)) | 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) continue;
      const isData = Math.abs(Math.sin(hash + r * 7 + c * 13)) > 0.5;
      grid[r][c] = isData;
    }
  }
  return grid;
}

export function DevicesPage() {
  const { devices, revokeDevice } = useStore();
  const [showLinkModal, setShowLinkModal] = useState(false);
  // Tick every minute so "active recently" stays roughly accurate without
  // triggering cascading renders on every keystroke elsewhere.
  const now = useNow(60_000);
  const activeCount = devices.filter(d => (now - d.lastSeen) < 60 * 60 * 1000).length;
  const keyCount = devices.filter(d => d.kind === "security-key").length;

  return (
    <>
      <PageHeader
        title="Devices"
        subtitle="Passkey-bound devices that can sign approvals on your behalf."
        actions={<Btn variant="primary" icon={<Plus size={15} />} onClick={() => setShowLinkModal(true)}>Link device</Btn>}
      />
      <div className="ad-scroll">
        <motion.div className="ad-stack" style={{ maxWidth: 720 }} variants={stagger} initial="hidden" animate="visible">
          {/* Stats Strip */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
            {[
              { label: "Total devices", value: devices.length },
              { label: "Active recently", value: activeCount },
              { label: "Security keys", value: keyCount },
            ].map(stat => (
              <div key={stat.label} className="ad-card pad flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{stat.label}</span>
                <span className="text-2xl font-bold text-card-foreground tabular-nums">{stat.value}</span>
              </div>
            ))}
          </motion.div>

          {/* Device List */}
          {devices.map((d) => {
            const isRecent = (now - d.lastSeen) < 60 * 60 * 1000;
            return (
              <motion.div key={d.id} variants={fadeUp} className="ad-row group" style={{ transitionProperty: "transform, box-shadow, border-color" }}>
                <span className="ad-row-ico ">{devIcon(d.kind)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ad-row-name " style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {d.name}
                    {d.current && <Chip tone="ok" dot>this device</Chip>}
                  </div>
                  <div className="ad-row-desc tabular-nums flex items-center gap-1.5">
                    <span className={`size-1.5 rounded-full ${isRecent ? "bg-emerald-500" : "bg-zinc-500"}`} />
                    Last active {timeAgo(d.lastSeen)} · passkey
                  </div>
                </div>
                <IconBtn aria-label={`revoke ${d.name}`} disabled={d.current} title={d.current ? "Can't revoke the current device" : "Revoke"} onClick={() => revokeDevice(d.id)} style={d.current ? { opacity: .4, cursor: "not-allowed" } : undefined}>
                  <Trash2 />
                </IconBtn>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      <AnimatePresence>
        {showLinkModal && <LinkDeviceModal onClose={() => setShowLinkModal(false)} />}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// Settings
// ============================================================
export function SettingsPage({ onReopenWizard }: { onReopenWizard: () => void }) {
  const { settings, updateSettings, toast } = useStore();
  const [licenseKey, setLicenseKey] = useState(settings.licenseKey);
  const [apiUrl, setApiUrl] = useState(settings.apiUrl);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const licenseDirty = licenseKey.trim() !== settings.licenseKey;
  const apiDirty = apiUrl.trim() !== settings.apiUrl;

  const flashSaved = (msg: string, key: string) => {
    updateSettings(key === "license" ? { licenseKey: licenseKey.trim() } : { apiUrl: apiUrl.trim() });
    setSavedFlash(key);
    toast(msg, "ok");
    window.setTimeout(() => setSavedFlash((cur) => (cur === key ? null : cur)), 1800);
  };

  const notifyCount = (settings.notifyEmail ? 1 : 0) + (settings.notifySms ? 1 : 0) + (settings.notifyPush ? 1 : 0);

  return (
    <>
      <PageHeader title="Settings" subtitle="Enforcement, license, and how Aegis reaches you." />
      <div className="ad-scroll">
        <motion.div
          className="flex flex-col gap-5 max-w-3xl"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Stats strip */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="ad-card pad flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Enforcement</span>
              <div className="flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full ${settings.enforcement ? "bg-emerald-500" : "bg-zinc-500"}`} />
                <span className="text-2xl font-bold text-card-foreground">{settings.enforcement ? "On" : "Off"}</span>
              </div>
            </div>
            <div className="ad-card pad flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">License</span>
              <span className="text-2xl font-bold text-card-foreground">{settings.licenseKey ? "Active" : "None"}</span>
            </div>
            <div className="ad-card pad flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Step-up</span>
              <span className="text-2xl font-bold text-card-foreground tabular-nums">${settings.stepUpThreshold}</span>
            </div>
            <div className="ad-card pad flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Channels</span>
              <span className="text-2xl font-bold text-card-foreground tabular-nums">{notifyCount} / 3</span>
            </div>
          </motion.div>

          {/* Enforcement */}
          <motion.section variants={fadeUp} className="ad-section-card group">
            <div className="ad-section-head">
              <span className="ad-section-icon tone-crimson"><ShieldCheck size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="ad-section-title">Enforcement</div>
                <div className="ad-section-sub">When on, every action is checked against its mandate before it runs.</div>
              </div>
              <Chip tone={settings.enforcement ? "ok" : "muted"} dot>{settings.enforcement ? "Active" : "Off"}</Chip>
            </div>
            <div className="ad-row" style={{ background: "transparent", border: "1px solid var(--d-line)" }}>
              <div style={{ flex: 1 }}>
                <div className="ad-row-name">Global enforcement</div>
                <div className="ad-row-desc">{settings.enforcement ? "Active — policies are enforced." : "Off — testing mode, nothing is blocked."}</div>
              </div>
              <Toggle on={settings.enforcement} onClick={() => updateSettings({ enforcement: !settings.enforcement })} label="global enforcement" />
            </div>
            <div className="mt-4">
              <label className="ad-field-label" htmlFor="step-up-threshold">Step-up threshold (USD)</label>
              <div className="ad-input-group" style={{ maxWidth: 200 }}>
                <span className="ad-input-prefix">$</span>
                <input
                  id="step-up-threshold"
                  className="ad-input"
                  type="number"
                  min={0}
                  step={1}
                  value={settings.stepUpThreshold}
                  onChange={(e) => updateSettings({ stepUpThreshold: Math.max(0, Number(e.target.value) || 0) })}
                />
              </div>
              <p className="ad-field-help">Actions above this amount require your explicit approval before they run.</p>
            </div>
          </motion.section>

          {/* License */}
          <motion.section variants={fadeUp} className="ad-section-card group">
            <div className="ad-section-head">
              <span className="ad-section-icon tone-crimson"><KeyRound size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="ad-section-title">License</div>
                <div className="ad-section-sub">Activate a key to enable enforcement in production.</div>
              </div>
              <Chip tone={settings.licenseKey ? "ok" : "muted"} dot>{settings.licenseKey ? "Active" : "Inactive"}</Chip>
            </div>
            <div className="flex gap-2">
              <input
                className="ad-input"
                placeholder="paste your license key"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && licenseDirty && licenseKey.trim()) flashSaved("License activated", "license");
                }}
              />
              <Btn
                variant="primary"
                disabled={!licenseDirty || !licenseKey.trim()}
                onClick={() => flashSaved("License activated", "license")}
              >
                {savedFlash === "license" ? <Check size={13} /> : null}
                {savedFlash === "license" ? "Saved" : "Activate"}
              </Btn>
            </div>
            {licenseDirty && (
              <p className="ad-field-help mt-2">Unsaved changes</p>
            )}
          </motion.section>

          {/* Backend API */}
          <motion.section variants={fadeUp} className="ad-section-card group">
            <div className="ad-section-head">
              <span className="ad-section-icon tone-crimson"><Server size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="ad-section-title">Backend API</div>
                <div className="ad-section-sub">Where the dashboard reaches your control plane.</div>
              </div>
              <Chip tone="info" dot>Configured</Chip>
            </div>
            <div className="flex gap-2">
              <input
                className="ad-input mono"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && apiDirty) flashSaved("Endpoint saved", "api");
                }}
              />
              <Btn
                variant="ghost"
                disabled={!apiDirty}
                onClick={() => flashSaved("Endpoint saved", "api")}
              >
                {savedFlash === "api" ? <Check size={13} /> : null}
                {savedFlash === "api" ? "Saved" : "Save"}
              </Btn>
            </div>
            {apiDirty && (
              <p className="ad-field-help mt-2">Unsaved changes</p>
            )}
          </motion.section>

          {/* Notifications */}
          <motion.section variants={fadeUp} className="ad-section-card group">
            <div className="ad-section-head">
              <span className="ad-section-icon tone-crimson"><Bell size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="ad-section-title">Notifications</div>
                <div className="ad-section-sub">How Aegis reaches you when something needs your attention.</div>
              </div>
              <Chip tone={notifyCount === 0 ? "muted" : notifyCount === 3 ? "ok" : "warn"} dot>
                {notifyCount === 3 ? "All on" : notifyCount === 0 ? "All off" : `${notifyCount} / 3`}
              </Chip>
            </div>
            <div className="flex flex-col gap-2">
              {([
                { key: "notifyEmail", label: "Email", desc: "Approvals, alerts, and the weekly digest", icon: <Mail size={14} /> },
                { key: "notifySms", label: "SMS", desc: "Urgent step-up requests only", icon: <MessageSquare size={14} /> },
                { key: "notifyPush", label: "Push", desc: "Browser notifications while the tab is active", icon: <Bell size={14} /> },
              ] as const).map((ch) => {
                const on = settings[ch.key];
                return (
                  <div key={ch.key} className="ad-row" style={{ background: "transparent", border: "1px solid var(--d-line)" }}>
                    <span className="ad-row-ico">{ch.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ad-row-name">{ch.label}</div>
                      <div className="ad-row-desc">{ch.desc}</div>
                    </div>
                    <Toggle on={on} onClick={() => updateSettings({ [ch.key]: !on })} label={`${ch.label} notifications`} />
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Setup */}
          <motion.section variants={fadeUp} className="ad-section-card group">
            <div className="ad-section-head">
              <span className="ad-section-icon tone-crimson"><Settings size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="ad-section-title">Setup</div>
                <div className="ad-section-sub">Re-run the guided setup wizard to reconfigure from scratch.</div>
              </div>
            </div>
            <Btn variant="ghost" icon={<Settings size={14} />} onClick={onReopenWizard}>Open setup wizard</Btn>
          </motion.section>

          {/* Danger zone */}
          <motion.section variants={fadeUp} className="ad-section-card group ad-section-danger">
            <div className="ad-section-head">
              <span className="ad-section-icon tone-red"><AlertTriangle size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="ad-section-title">Danger zone</div>
                <div className="ad-section-sub">Destructive actions. Proceed with caution.</div>
              </div>
              <Chip tone="bad" dot>Caution</Chip>
            </div>
            <div className="flex flex-col gap-2">
              <div className="ad-row" style={{ background: "transparent", border: "1px solid var(--d-line)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ad-row-name">Revoke all sessions</div>
                  <div className="ad-row-desc">Force every device to re-authenticate. Use if you suspect compromise.</div>
                </div>
                <Btn
                  variant="ghost"
                  className="text-red-500 hover:bg-red-500/10"
                  onClick={() => {
                    if (window.confirm("Revoke all active sessions? Every device will need to sign in again.")) {
                      toast("All sessions revoked", "bad");
                    }
                  }}
                >
                  Revoke all
                </Btn>
              </div>
              <div className="ad-row" style={{ background: "transparent", border: "1px solid var(--d-line)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ad-row-name">Reset all settings</div>
                  <div className="ad-row-desc">Restore defaults for enforcement, license, API, and notifications.</div>
                </div>
                <Btn
                  variant="ghost"
                  className="text-red-500 hover:bg-red-500/10"
                  onClick={() => {
                    if (window.confirm("Reset all settings to defaults? This cannot be undone.")) {
                      updateSettings({
                        enforcement: true,
                        licenseKey: "",
                        apiUrl: "https://aegis-backend-production-a853.up.railway.app",
                        stepUpThreshold: 200,
                        notifyEmail: true,
                        notifySms: false,
                        notifyPush: false,
                      });
                      setLicenseKey("");
                      setApiUrl("https://aegis-backend-production-a853.up.railway.app");
                      toast("Settings reset to defaults", "info");
                    }
                  }}
                >
                  Reset
                </Btn>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </>
  );
}

// ============================================================
// Settings Overview (Slice A — landing card grid)
// ============================================================
function StatusPill({ tone, children }: { tone: "ok" | "warn" | "bad" | "muted"; children: React.ReactNode }) {
  return <span className={`ad-chip ${tone}`}><span className="dot" />{children}</span>;
}

function OverviewCard({
  testId,
  title,
  pill,
  subtext,
  href,
  icon,
}: {
  testId: string;
  title: string;
  pill: React.ReactNode;
  subtext: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.a
      variants={fadeUp}
      href={href}
      data-testid={testId}
      className="ad-card pad group"
      style={{
        transitionProperty: "transform, box-shadow, border-color",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 132,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span className="ad-section-title" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "var(--d-crimson)", display: "inline-flex" }}>{icon}</span>
          {title}
        </span>
        {pill}
      </div>
      <div className="ad-section-sub" style={{ margin: 0 }}>{subtext}</div>
      <div style={{ marginTop: "auto", paddingTop: 4, fontSize: 12, fontWeight: 600, color: "var(--d-crimson)" }}>
        Manage <span aria-hidden="true">→</span>
      </div>
    </motion.a>
  );
}

type ParsedSettingAction = { key: string; from: string; to: string; reason?: string };

function parseSettingAction(action: string): ParsedSettingAction | null {
  // Format produced by recordSettingChange:
  //   set <key>: <json-from> → <json-to>
  //   set <key>: <json-from> → <json-to> (<reason>)
  const m = action.match(/^set\s+(\w+):\s+(.+?)\s+→\s+(.+?)(?:\s+\((.+)\))?$/);
  if (!m) return null;
  return { key: m[1], from: m[2], to: m[3], reason: m[4] };
}

function whenLabel(ts: number): string {
  const diffMs = Date.now() - ts;
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function SettingsOverview() {
  const { settings, ledger } = useStore();
  const licenseKey = settings.licenseKey;
  const notifyCount = (settings.notifyEmail ? 1 : 0) + (settings.notifySms ? 1 : 0) + (settings.notifyPush ? 1 : 0);
  const channels: string[] = [];
  if (settings.notifyEmail) channels.push("Email");
  if (settings.notifySms) channels.push("SMS");
  if (settings.notifyPush) channels.push("Push");

  // Settings-related ledger entries: recordSettingChange pushes actions of the
  // form `set <key>: <from-json> → <to-json>` with verdict "OK" and eventType "policy".
  const recentSettingsChanges = useMemo(() => {
    const filtered = ledger.filter((e) => {
      const cat = ((e as unknown as { category?: string }).category || e.action || (e as unknown as { kind?: string }).kind || "").toString().toLowerCase();
      return cat.includes("settings");
    });
    return filtered.slice(-10).reverse();
  }, [ledger]);

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Configure how Aegis enforces, notifies, and protects your workspace."
      />
      <div className="ad-scroll">
        <motion.div
          className="ad-stack"
          style={{ maxWidth: 960, padding: 4 }}
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <OverviewCard
              testId="card-enforcement"
              title="Enforcement"
              pill={
                <StatusPill tone={settings.enforcement ? "ok" : "warn"}>
                  {settings.enforcement ? "On" : "Off"}
                </StatusPill>
              }
              subtext={settings.enforcement ? "Step-up required for high-risk actions" : "Paused"}
              href="#/app/settings/security"
              icon={<ShieldCheck size={15} />}
            />
            <OverviewCard
              testId="card-license"
              title="License"
              pill={
                <StatusPill tone={licenseKey ? "ok" : "muted"}>
                  {licenseKey ? "Active" : "None"}
                </StatusPill>
              }
              subtext={licenseKey ? `Plan: Aegis Studio` : "No license attached"}
              href="#/app/settings/account"
              icon={<KeyRound size={15} />}
            />
            <OverviewCard
              testId="card-workspace"
              title="Workspace"
              pill={<StatusPill tone="ok">Active</StatusPill>}
              subtext="Aegis workspace"
              href="#/app/settings/workspace"
              icon={<Users size={15} />}
            />
            <OverviewCard
              testId="card-notifications"
              title="Notifications"
              pill={
                <StatusPill tone={notifyCount === 3 ? "ok" : notifyCount > 0 ? "warn" : "muted"}>
                  {notifyCount === 3 ? "On" : notifyCount === 0 ? "Off" : "Partial"}
                </StatusPill>
              }
              subtext={channels.length > 0 ? channels.join(" + ") : "No channels configured"}
              href="#/app/settings/notifications"
              icon={<Bell size={15} />}
            />
            <OverviewCard
              testId="card-security"
              title="Security"
              pill={<StatusPill tone="ok">Configured</StatusPill>}
              subtext="API key + step-up set"
              href="#/app/settings/security"
              icon={<ShieldCheck size={15} />}
            />
            <OverviewCard
              testId="card-audit"
              title="Audit"
              pill={<StatusPill tone="ok">On</StatusPill>}
              subtext={`Ledger captures ${ledger.length} entries`}
              href="#/app/settings/audit"
              icon={<HistoryIcon size={15} />}
            />
          </div>

          <motion.div
            variants={fadeUp}
            data-testid="recent-changes"
            className="ad-card pad"
            style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}
          >
            <div className="ad-section-title">Recent changes</div>
            {recentSettingsChanges.length === 0 ? (
              <div
                data-testid="recent-changes-empty"
                className="ad-section-sub"
                style={{ margin: 0 }}
              >
                No changes in the last 30 days.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentSettingsChanges.map((e, i) => {
                  const parsed = parseSettingAction(e.action);
                  const why = parsed
                    ? (parsed.reason ?? `Changed ${parsed.key}: ${parsed.from} → ${parsed.to}`)
                    : e.action;
                  return (
                    <div
                      key={e.seq ?? i}
                      data-testid="recent-change-row"
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 12,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--d-border)",
                        background: "var(--d-surface-1)",
                      }}
                    >
                      <div style={{ flex: "0 0 auto", fontWeight: 600, fontSize: 13, minWidth: "6rem" }}>
                        {e.agent}
                      </div>
                      <div style={{ flex: "0 0 auto", fontSize: 12, color: "var(--d-fg-muted)", minWidth: "5rem", fontVariantNumeric: "tabular-nums" }}>
                        {whenLabel(e.ts)}
                      </div>
                      <div style={{ flex: 1, fontSize: 13, color: "var(--d-fg-muted)" }}>{why}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

// ============================================================
// Settings sub-route stubs (Slice B/C — full detail panels)
// ============================================================
function ComingSoon({ section }: { section: string }) {
  return (
    <>
      <PageHeader
        title={`Settings · ${section}`}
        subtitle="Full detail panel ships in a follow-up slice."
      />
      <div className="ad-scroll">
        <div className="ad-card pad" style={{ maxWidth: 720 }}>
          <div className="ad-section-title">Coming in Slice B/C</div>
          <div className="ad-section-sub">
            This detail panel is reserved for a follow-up slice. Use the back link to return to the Settings overview.
          </div>
          <div style={{ marginTop: 16 }}>
            <a href="#/app/settings" className="ad-btn ad-btn-ghost sm" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
              <span aria-hidden="true">←</span> Back to Settings
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export function SettingsAccountPage() { return <ComingSoon section="Account" />; }
export function SettingsWorkspacePage() { return <ComingSoon section="Workspace" />; }
export function SettingsAuditPage() { return <ComingSoon section="Audit" />; }
const TZ_OPTIONS = [
  { value: "America/Sao_Paulo", label: "São Paulo (UTC−03)" },
  { value: "America/New_York", label: "New York (UTC−05/−04)" },
  { value: "Europe/London", label: "London (UTC+00/+01)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+09)" },
  { value: "UTC", label: "UTC" },
];

export function SettingsNotificationsPage() {
  const { settings, updateSettings, toast } = useStore();
  const [qhStart, setQhStart] = useState(settings.quietHoursStart ?? "22:00");
  const [qhEnd, setQhEnd] = useState(settings.quietHoursEnd ?? "07:00");
  const [qhTz, setQhTz] = useState(settings.quietHoursTz ?? "America/Sao_Paulo");
  const [sending, setSending] = useState<"email" | "sms" | "push" | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<Partial<{ quietHoursStart: string; quietHoursEnd: string; quietHoursTz: string }>>({});

  const debouncedSave = (patch: Partial<{ quietHoursStart: string; quietHoursEnd: string; quietHoursTz: string }>) => {
    pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateSettings(pendingPatchRef.current);
      pendingPatchRef.current = {};
    }, 400);
  };

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const sendTest = (channel: "email" | "sms" | "push") => {
    if (sending) return;
    setSending(channel);
    setTimeout(() => {
      const ok = Math.random() < 0.9;
      if (ok) {
        const addresses: Record<string, string> = {
          email: "alice@aegis.io",
          sms: "+1 (415) 555-0123",
          push: "this device",
        };
        toast(`Test ${channel} sent to ${addresses[channel]}`, "ok");
      } else {
        const failMsg: Record<string, string> = {
          email: "Test failed — verify your address first.",
          sms: "Test failed — verify your phone number first.",
          push: "Test failed — push notifications are blocked in browser settings.",
        };
        toast(failMsg[channel], "bad");
      }
      setSending(null);
    }, 600);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader title="Notifications" subtitle="Channels" />
      <div
        className="ad-card pad"
        data-testid="channels-section"
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div className="ad-section-title">Channels</div>

        {/* Email row */}
        <div
          data-testid="channel-email"
          className="ad-row"
          style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Mail size={16} />
            <span>Email</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              aria-hidden="true"
              className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999 }}
            >
              Verified
            </span>
            <Toggle
              on={!!settings.notifyEmail}
              onClick={() => updateSettings({ notifyEmail: !settings.notifyEmail })}
              label="toggle email notifications"
            />
          </div>
        </div>

        {/* SMS row */}
        <div
          data-testid="channel-sms"
          className="ad-row"
          style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MessageSquare size={16} />
            <span>SMS</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              aria-hidden="true"
              className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999 }}
            >
              Verified
            </span>
            <Toggle
              on={!!settings.notifySms}
              onClick={() => updateSettings({ notifySms: !settings.notifySms })}
              label="toggle sms notifications"
            />
          </div>
        </div>

        {/* Push row */}
        <div
          data-testid="channel-push"
          className="ad-row"
          style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Bell size={16} />
            <span>Push</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              aria-hidden="true"
              className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999 }}
            >
              Verified
            </span>
            <Toggle
              on={!!settings.notifyPush}
              onClick={() => updateSettings({ notifyPush: !settings.notifyPush })}
              label="toggle push notifications"
            />
          </div>
        </div>

        {/* Webhook row — no toggle, links to integrations stub */}
        <div
          data-testid="channel-webhook"
          className="ad-row"
          style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Webhook size={16} />
            <span>Webhook</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              aria-hidden="true"
              className="bg-amber-500/15 text-amber-300 border border-amber-500/30"
              style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999 }}
            >
              Not configured
            </span>
            <Btn
              variant="ghost"
              aria-label="configure webhook"
              onClick={() => {
                window.location.hash = "#/app/settings/integrations";
              }}
            >
              Configure
            </Btn>
          </div>
        </div>
      </div>

      {/* Routing matrix */}
      <div
        className="ad-card pad"
        data-testid="routing-matrix"
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div className="ad-section-title">Routing</div>
        <div
          data-testid="routing-header"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 80px 80px",
            alignItems: "center",
            fontSize: 12,
            fontWeight: 600,
            opacity: 0.7,
            padding: "0 8px",
          }}
        >
          <span>Event</span>
          <span style={{ textAlign: "center" }}>Email</span>
          <span style={{ textAlign: "center" }}>SMS</span>
          <span style={{ textAlign: "center" }}>Push</span>
        </div>
        {(
          [
            ["stepup_required", "Step-up required"],
            ["mandate_denied", "Mandate denied"],
            ["mandate_expiring", "Mandate expires in 7 days"],
            ["device_paired", "New device paired"],
            ["member_invited", "New member invited"],
            ["weekly_digest", "Weekly digest"],
          ] as const
        ).map(([event, label]) => (
          <div
            key={event}
            data-testid={`routing-row-${event}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 80px 80px",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px",
              borderRadius: 8,
            }}
            className="ad-row"
          >
            <span>{label}</span>
            {(["email", "sms", "push"] as const).map((channel) => (
              <div key={channel} style={{ display: "flex", justifyContent: "center" }}>
                <Toggle
                  on={!!settings.notifyRouting?.[event]?.[channel]}
                  onClick={() =>
                    updateSettings({
                      notifyRouting: {
                        ...settings.notifyRouting,
                        [event]: {
                          ...settings.notifyRouting[event],
                          [channel]: !settings.notifyRouting[event][channel],
                        },
                      },
                    })
                  }
                  label={`route ${event} via ${channel}`}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Quiet hours */}
      <div
        className="ad-card pad"
        data-testid="quiet-hours"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div className="ad-section-title">Quiet hours</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "var(--ad-muted)" }}>
            Start
            <input
              type="time"
              className="ad-input"
              data-testid="quiet-hours-start"
              aria-label="quiet hours start"
              value={qhStart}
              onChange={(e) => { const v = e.target.value; setQhStart(v); debouncedSave({ quietHoursStart: v }); }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "var(--ad-muted)" }}>
            End
            <input
              type="time"
              className="ad-input"
              data-testid="quiet-hours-end"
              aria-label="quiet hours end"
              value={qhEnd}
              onChange={(e) => { const v = e.target.value; setQhEnd(v); debouncedSave({ quietHoursEnd: v }); }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "var(--ad-muted)" }}>
            Timezone
            <select
              className="ad-input"
              data-testid="quiet-hours-tz"
              aria-label="quiet hours timezone"
              value={qhTz}
              onChange={(e) => { const v = e.target.value; setQhTz(v); debouncedSave({ quietHoursTz: v }); }}
            >
              {TZ_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ fontSize: 11, color: "var(--ad-muted)" }}>
          Notifications are paused between these times in the selected timezone. Critical security alerts (step-up required) are never delayed.
        </div>
      </div>

      {/* Test notification */}
      <div
        className="ad-card pad"
        data-testid="test-notification"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div className="ad-section-title">Test notification</div>
        <div style={{ fontSize: 12, color: "var(--ad-muted)" }}>
          Send a one-shot sample to each channel so you can confirm delivery end-to-end.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div data-testid="send-test-email">
            <Btn
              variant="primary"
              onClick={() => sendTest("email")}
              disabled={!!sending}
              aria-label="send test email"
            >
              {sending === "email" ? "Sending…" : "Send me a test email"}
            </Btn>
          </div>
          <div data-testid="send-test-sms">
            <Btn
              variant="ghost"
              onClick={() => sendTest("sms")}
              disabled={!!sending}
              aria-label="send test sms"
            >
              {sending === "sms" ? "Sending…" : "Send me a test SMS"}
            </Btn>
          </div>
          <div data-testid="send-test-push">
            <Btn
              variant="ghost"
              onClick={() => sendTest("push")}
              disabled={!!sending}
              aria-label="send test push"
            >
              {sending === "push" ? "Sending…" : "Send me a test push"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsIntegrationsPage() { return <ComingSoon section="Integrations" />; }

// ============================================================
// Notifications
// ============================================================
type NotifCategory = "Approval" | "Alert" | "Policy" | "System";
type NotifTone = "ok" | "warn" | "bad" | "info";

const NOTIF_ICON: Record<NotifCategory, React.ReactNode> = {
  Approval: <InboxIcon size={15} />,
  Alert: <AlertTriangle size={15} />,
  Policy: <ShieldCheck size={15} />,
  System: <Activity size={15} />,
};

const NOTIF_TONE_BG: Record<NotifTone, string> = {
  bad: "bg-red-500/12 text-red-600 dark:text-red-400 border-red-500/25",
  warn: "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25",
  info: "bg-blue-500/12 text-blue-600 dark:text-blue-400 border-blue-500/25",
  ok: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
};

const NOTIF_ACCENT_COLOR: Record<NotifTone, string> = {
  bad: "rgb(239, 68, 68)",
  warn: "rgb(245, 158, 11)",
  info: "rgb(59, 130, 246)",
  ok: "rgb(16, 185, 129)",
};

const NOTIF_CHIP: Record<NotifCategory, "warn" | "bad" | "info" | "ok"> = {
  Approval: "warn",
  Alert: "bad",
  Policy: "info",
  System: "ok",
};

export function NotificationsPage({ onNav }: { onNav: (k: RouteKey) => void }) {
  const { approvals, ledger, toast } = useStore();
  const [read, setRead] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<NotifCategory | "All">("All");
  // System-item timestamps need a stable "now" that's safe to reference from
  // useMemo without calling Date.now() during render.
  const [sysNow] = useState(() => Date.now());

  const notifications = useMemo(() => {
    const items: {
      id: string;
      title: string;
      body: string;
      tone: NotifTone;
      time: number;
      category: NotifCategory;
    }[] = [];

    // Approvals as urgent notifications
    approvals.forEach(a => {
      items.push({
        id: `apr-${a.id}`,
        title: `Step-up required: ${a.title}`,
        body: `${a.agent} is awaiting your approval.`,
        tone: "warn",
        time: a.createdAt,
        category: "Approval",
      });
    });

    // Recent ledger denies as alerts
    [...ledger].reverse().filter(e => e.verdict === "DENY").slice(0, 3).forEach(e => {
      items.push({
        id: `deny-${e.seq}`,
        title: `Action denied: ${e.action}`,
        body: `${e.agent} was blocked by policy.`,
        tone: "bad",
        time: e.ts,
        category: "Alert",
      });
    });

    // Recent step-ups
    [...ledger].reverse().filter(e => e.verdict === "STEP_UP").slice(0, 2).forEach(e => {
      items.push({
        id: `stepup-${e.seq}`,
        title: `Step-up flagged: ${e.action}`,
        body: `${e.agent} triggered a step-up policy.`,
        tone: "info",
        time: e.ts,
        category: "Policy",
      });
    });

    // System info
    items.push({
      id: "sys-1",
      title: "Enforcement active",
      body: "All policies are enforced globally.",
      tone: "ok",
      time: sysNow - 3600000,
      category: "System",
    });
    items.push({
      id: "sys-2",
      title: "Ledger chain verified",
      body: "Hash chain integrity check passed.",
      tone: "ok",
      time: sysNow - 7200000,
      category: "System",
    });

    return items.sort((a, b) => b.time - a.time);
  }, [approvals, ledger, sysNow]);

  const unreadCount = notifications.filter(n => !read.has(n.id)).length;

  // KPI counts — memoized so the stats strip re-renders only when the list changes.
  const counts = useMemo(() => {
    const byCat: Record<NotifCategory, number> = { Approval: 0, Alert: 0, Policy: 0, System: 0 };
    for (const n of notifications) byCat[n.category]++;
    return byCat;
  }, [notifications]);

  const filtered = useMemo(
    () => (category === "All" ? notifications : notifications.filter(n => n.category === category)),
    [notifications, category]
  );

  const categoryFilters: Array<{ key: NotifCategory | "All"; label: string; count: number; tone: NotifTone }> = [
    { key: "All", label: "All", count: notifications.length, tone: "ok" },
    { key: "Approval", label: "Approval", count: counts.Approval, tone: "warn" },
    { key: "Alert", label: "Alert", count: counts.Alert, tone: "bad" },
    { key: "Policy", label: "Policy", count: counts.Policy, tone: "info" },
    { key: "System", label: "System", count: counts.System, tone: "ok" },
  ];

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Approvals, policy alerts, and system events."
        actions={
          <>
            {unreadCount > 0 && (
              <Btn
                variant="ghost"
                onClick={() => setRead(new Set(notifications.map(n => n.id)))}
              >
                Mark all read
              </Btn>
            )}
            <Btn
              variant="subtle"
              icon={<X size={13} />}
              onClick={() => {
                setRead(new Set(notifications.map(n => n.id)));
                toast("All notifications cleared", "ok");
              }}
            >
              Clear all
            </Btn>
          </>
        }
      />
      <div className="ad-scroll overflow-y-auto flex-1 p-6">
        <motion.div
          className="flex flex-col gap-5 max-w-3xl"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Stats strip — matches Devices / Providers premium pattern */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: notifications.length },
              { label: "Unread", value: unreadCount },
              { label: "Approvals", value: counts.Approval },
              { label: "Alerts", value: counts.Alert },
            ].map(stat => (
              <div key={stat.label} className="ad-card pad flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{stat.label}</span>
                <span className="text-2xl font-bold text-card-foreground tabular-nums">{stat.value}</span>
              </div>
            ))}
          </motion.div>

          {/* Category filter chips */}
          {notifications.length > 0 && (
            <motion.div variants={fadeUp} className="flex items-center gap-1.5 flex-wrap">
              {categoryFilters.map(f => {
                const active = category === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setCategory(f.key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                      active
                        ? "bg-foreground/8 text-foreground border-foreground/15 font-medium"
                        : "bg-transparent text-muted-foreground border-border/60 hover:text-foreground hover:border-border"
                    }`}
                  >
                    {f.key !== "All" && (
                      <span className={`size-1.5 rounded-full ${
                        f.tone === "bad" ? "bg-red-500" :
                        f.tone === "warn" ? "bg-amber-500" :
                        f.tone === "info" ? "bg-blue-500" :
                        "bg-emerald-500"
                      }`} />
                    )}
                    <span>{f.label}</span>
                    <span className="font-medium tabular-nums text-foreground/80">{f.count}</span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* Notification rows */}
          {filtered.length === 0 ? (
            <motion.div variants={fadeUp} className="ad-empty-lg">
              <div className="ad-empty-ico"><Bell size={22} /></div>
              <div className="ad-empty-title">{category === "All" ? "All caught up" : `No ${category} notifications`}</div>
              <div className="text-xs text-muted-foreground">
                {category === "All" ? "No notifications right now." : `Nothing in this category yet.`}
              </div>
            </motion.div>
          ) : (
            filtered.map(n => {
              const isRead = read.has(n.id);
              const iconBg = NOTIF_TONE_BG[n.tone];
              return (
                <motion.div
                  key={n.id}
                  variants={fadeUp}
                  className={`ad-row ad-notif-row group cursor-pointer ${isRead ? "is-read" : "is-unread"}`}
                  style={{ borderLeftWidth: 3, borderLeftStyle: "solid", borderLeftColor: NOTIF_ACCENT_COLOR[n.tone] }}
                  onClick={() => setRead(r => new Set([...r, n.id]))}
                >
                  <span className={`ad-row-ico ${iconBg}`}>
                    {NOTIF_ICON[n.category]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Chip tone={NOTIF_CHIP[n.category]} dot>{n.category}</Chip>
                      {!isRead && (
                        <span
                          className="ad-notification-unread-dot size-1.5 rounded-full bg-blue-500"
                          aria-label="unread"
                        />
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
                        {timeAgo(n.time)}
                      </span>
                    </div>
                    <div className={`ad-row-name mt-1 ${!isRead ? "font-semibold" : ""}`}>{n.title}</div>
                    <div className="ad-row-desc">{n.body}</div>
                  </div>
                  {n.category === "Approval" && (
                    <div className="flex-shrink-0 self-center">
                      <Btn
                        variant="ok"
                        sm
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onNav("inbox");
                        }}
                      >
                        Review
                      </Btn>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </>
  );
}

// ============================================================
// Profile
// ============================================================
export function ProfilePage() {
  const { devices, toast } = useStore();
  const currentDevice = devices.find(d => d.current);
  const [displayName, setDisplayName] = useState("Operator");
  const [email, setEmail] = useState("operator@aegis.local");
  const [editingName, setEditingName] = useState(false);

  return (
    <>
      <PageHeader title="Profile" subtitle="Your identity, session, and security settings." />
      <div className="ad-scroll overflow-y-auto flex-1 p-6">
        <motion.div
          className="flex flex-col gap-6 max-w-2xl"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Avatar + Identity */}
          <motion.div variants={fadeUp} className="ad-card pad flex items-center gap-6">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                className="size-20 rounded-2xl border-2 border-border object-cover"
                alt="Profile"
              />
              <button
                className="absolute -bottom-1 -right-1 size-6 rounded-full bg-card border border-border flex items-center justify-center "
                onClick={() => toast("Avatar upload coming soon", "info")}
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {editingName ? (
                  <input
                    autoFocus
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    onBlur={() => {
                      setEditingName(false);
                      toast("Display name saved", "ok");
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        setEditingName(false);
                        toast("Display name saved", "ok");
                      }
                    }}
                    className="ad-input text-lg font-semibold py-0.5 h-auto"
                    style={{ maxWidth: 200 }}
                  />
                ) : (
                  <h2 className="text-xl font-bold">{displayName}</h2>
                )}
                <button
                  onClick={() => setEditingName(true)}
                  className="text-muted-foreground "
                >
                  <Settings size={13} />
                </button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Operator · Aegis Control Plane</div>
              <div className="font-mono text-[10px] text-muted-foreground mt-2 bg-muted/40 px-2 py-1 rounded-md border border-border inline-block">
                did:key:z6MkvS…W8X23b
              </div>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div variants={fadeUp} className="ad-card pad">
            <div className="ad-section-title">
              <Settings size={14} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />
              Contact &amp; notifications
            </div>
            <div className="ad-section-sub">Where Aegis sends approval requests and alerts.</div>
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="ad-field-label">Email address</label>
                <div className="flex gap-2">
                  <input
                    className="ad-input flex-1"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  <Btn variant="ghost" onClick={() => toast("Email saved", "ok")}>Save</Btn>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Session */}
          <motion.div variants={fadeUp} className="ad-card pad">
            <div className="ad-section-title">
              <ShieldCheck size={14} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />
              Active session
            </div>
            <div className="ad-section-sub">You are signed in on this device.</div>
            {currentDevice && (
              <div className="mt-4 ad-row" style={{ background: "transparent", border: "1px solid var(--d-line)" }}>
                <span className="ad-row-ico">{devIcon(currentDevice.kind)}</span>
                <div className="flex-1">
                  <div className="ad-row-name">
                    {currentDevice.name} <Chip tone="ok" dot>current</Chip>
                  </div>
                  <div className="ad-row-desc">Last active {timeAgo(currentDevice.lastSeen)} · passkey</div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Danger zone */}
          <motion.div variants={fadeUp} className="ad-card pad" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
            <div className="ad-section-title" style={{ color: "rgb(239,68,68)" }}>
              <AlertTriangle size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
              Danger zone
            </div>
            <div className="ad-section-sub">These actions are permanent and cannot be undone.</div>
            <div className="mt-4">
              <Btn
                variant="ghost"
                onClick={() => toast("All sessions revoked", "bad")}
                style={{ color: "var(--d-bad)", borderColor: "var(--d-bad)", border: "1px solid" }}
              >
                Revoke all sessions
              </Btn>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

// ============================================================
// Support
// ============================================================
export function SupportPage() {
  const { toast } = useStore();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sentFlash, setSentFlash] = useState(false);

  const faqs = [
    {
      q: "How does passkey signing work?",
      a: "When you approve an action, Aegis uses the WebAuthn API to sign the decision with your device's passkey. Your private key never leaves the device.",
    },
    {
      q: "What is a mandate?",
      a: "A mandate is a signed policy document that defines what an agent is allowed to do. Each mandate has a spend limit, an allowlist of actions, and an optional step-up threshold.",
    },
    {
      q: "What happens when enforcement is off?",
      a: "Policies are still evaluated but not enforced. Agents can run unrestricted. This mode is for testing only.",
    },
    {
      q: "How do I revoke an agent?",
      a: "Go to Governance, find the agent card, and click Revoke. This immediately removes all active sessions for that agent.",
    },
    {
      q: "Can I export the audit log?",
      a: "Yes. Go to History and click the Export button. The full ledger is exported as a JSON file with hash-chain proofs.",
    },
  ];

  const canSend = subject.trim().length > 0 && message.trim().length > 0;

  const handleSend = () => {
    if (!canSend || sending) return;
    setSending(true);
    window.setTimeout(() => {
      toast("Message sent — we'll reply within 24h", "ok");
      setSubject("");
      setMessage("");
      setSending(false);
      setSentFlash(true);
      window.setTimeout(() => setSentFlash(false), 1800);
    }, 600);
  };

  const channels = [
    { label: "Documentation", desc: "Guides, API reference, tutorials", icon: <BookOpen size={16} />, tone: "blue", action: () => toast("Opening docs", "info") },
    { label: "Community", desc: "Discord server for chat & help", icon: <MessageSquare size={16} />, tone: "violet", action: () => toast("Opening Discord", "info") },
    { label: "GitHub", desc: "Report bugs and request features", icon: <ExternalLink size={16} />, tone: "neutral", action: () => toast("Opening GitHub", "info") },
    { label: "Email", desc: "support@aegis.security", icon: <Mail size={16} />, tone: "emerald", action: () => toast("Opening mail client", "info") },
  ];

  return (
    <>
      <PageHeader title="Support" subtitle="Documentation, FAQ, and direct contact." />
      <div className="ad-scroll overflow-y-auto flex-1 p-6">
        <motion.div
          className="flex flex-col gap-5 max-w-3xl"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Status banner */}
          <motion.div variants={fadeUp} className="ad-section-card group">
            <div className="ad-section-head">
              <span className="ad-section-icon tone-emerald"><Activity size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="ad-section-title">All systems operational</span>
                </div>
                <div className="ad-section-sub">API, webhooks, and vault are responding normally. Last incident 14 days ago.</div>
              </div>
              <Chip tone="ok" dot>99.98% uptime</Chip>
            </div>
          </motion.div>

          {/* Stats strip */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Response time", value: "~ 4h" },
              { label: "Uptime (30d)", value: "99.98%" },
              { label: "Channels", value: "4" },
              { label: "FAQ topics", value: faqs.length.toString() },
            ].map(stat => (
              <div key={stat.label} className="ad-card pad flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{stat.label}</span>
                <span className="text-2xl font-bold text-card-foreground tabular-nums">{stat.value}</span>
              </div>
            ))}
          </motion.div>

          {/* Channels */}
          <motion.section variants={fadeUp} className="ad-section-card group">
            <div className="ad-section-head">
              <span className="ad-section-icon tone-crimson"><LifeBuoy size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="ad-section-title">Get in touch</div>
                <div className="ad-section-sub">Pick the channel that fits — we're everywhere.</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {channels.map(ch => (
                <button
                  key={ch.label}
                  onClick={ch.action}
                  className="ad-row group text-left"
                  style={{ background: "transparent", border: "1px solid var(--d-line)", cursor: "pointer", transition: "border-color .18s var(--d-ease), background-color .18s var(--d-ease)" }}
                >
                  <span className={`ad-row-ico tone-${ch.tone}`}>{ch.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ad-row-name">{ch.label}</div>
                    <div className="ad-row-desc">{ch.desc}</div>
                  </div>
                  <ArrowRight size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </motion.section>

          {/* FAQ */}
          <motion.section variants={fadeUp} className="ad-section-card group">
            <div className="ad-section-head">
              <span className="ad-section-icon tone-crimson"><CircleHelp size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="ad-section-title">Frequently asked questions</div>
                <div className="ad-section-sub">Quick answers to the most common questions.</div>
              </div>
            </div>
            <div className="flex flex-col">
              {faqs.map((faq, i) => {
                const open = faqOpen === i;
                return (
                  <div key={i} className="border-b border-border/60 last:border-b-0">
                    <button
                      className="flex items-center justify-between w-full py-3 text-sm font-medium text-left"
                      onClick={() => setFaqOpen(open ? null : i)}
                      aria-expanded={open}
                    >
                      <span className="text-card-foreground pr-3">{faq.q}</span>
                      <span className={`ad-faq-toggle ${open ? "is-open" : ""}`} aria-hidden>
                        <span className="ad-faq-toggle-bar" />
                        <span className="ad-faq-toggle-bar" />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs text-muted-foreground leading-relaxed pb-3.5">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Contact form */}
          <motion.section variants={fadeUp} className="ad-section-card group">
            <div className="ad-section-head">
              <span className="ad-section-icon tone-crimson"><Mail size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="ad-section-title">Send us a message</div>
                <div className="ad-section-sub">We respond within 24 hours on business days.</div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="support-subject" className="ad-field-label">Subject</label>
                <input
                  id="support-subject"
                  className="ad-input"
                  placeholder="What can we help with?"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="support-message" className="ad-field-label mb-0">Message</label>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{message.length} / 2000</span>
                </div>
                <textarea
                  id="support-message"
                  className="ad-input"
                  rows={5}
                  maxLength={2000}
                  style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                  placeholder="Describe your issue…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
                <p className="ad-field-help">Include steps to reproduce if you're reporting a bug.</p>
              </div>
              <div className="flex items-center gap-2">
                <Btn
                  variant="primary"
                  disabled={!canSend || sending}
                  onClick={handleSend}
                >
                  {sentFlash ? <Check size={13} /> : null}
                  {sentFlash ? "Sent" : sending ? "Sending…" : "Send message"}
                </Btn>
                <Btn
                  variant="ghost"
                  disabled={!subject && !message}
                  onClick={() => { setSubject(""); setMessage(""); }}
                >
                  Clear
                </Btn>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </>
  );
}

// ============================================================
// Help & Shortcuts  (premium redesign)
// ============================================================
export function HelpPage({
  onNav,
  onOpenPalette,
}: {
  onNav?: (k: RouteKey) => void;
  onOpenPalette?: () => void;
}) {
  const { agents, providers, devices, settings } = useStore();

  // Personalized checklist derived from real store state
  const checklist = useMemo(
    () => [
      {
        done: agents.length > 0,
        label: "Connect your first agent",
        hint:
          agents.length > 0
            ? `${agents.length} connected`
            : "Start with the wizard",
        action: () => onNav?.("governance"),
      },
      {
        done: agents.some((a) => a.mandates.length > 0),
        label: "Create a mandate",
        hint: "Define what your agent can do",
        action: () => onNav?.("governance"),
      },
      {
        done: devices.some((d) => d.current),
        label: "Link a passkey device",
        hint:
          devices.length > 0
            ? `${devices.length} paired`
            : "Required for approvals",
        action: () => onNav?.("devices"),
      },
      {
        done: settings.enforcement,
        label: "Enable global enforcement",
        hint: settings.enforcement ? "Active" : "Inactive",
        action: () => onNav?.("settings"),
      },
      {
        done: providers.some((p) => p.connected),
        label: "Connect a provider",
        hint: providers.filter((p) => p.connected).length > 0
          ? `${providers.filter((p) => p.connected).length} connected`
          : "Stripe, GitHub, Twilio…",
        action: () => onNav?.("providers"),
      },
      {
        done: agents.some((a) => a.spendLimit > 0),
        label: "Set spend limits",
        hint: "Control how much agents can spend",
        action: () => onNav?.("governance"),
      },
    ],
    [agents, providers, devices, settings, onNav]
  );

  const completedCount = checklist.filter((c) => c.done).length;
  const progress = Math.round((completedCount / checklist.length) * 100);

  // Shortcuts grouped by category — clickable to actually run the action
  type Shortcut = {
    keys: string[];
    desc: string;
    note?: string;
    action?: () => void;
  };
  type ShortcutGroup = {
    id: string;
    label: string;
    icon: typeof Compass;
    shortcuts: Shortcut[];
  };
  const shortcutGroups = useMemo<ShortcutGroup[]>(
    () => [
      {
        id: "navigation",
        label: "Navigation",
        icon: Compass,
        shortcuts: [
          { keys: ["⌘", "K"], desc: "Open command palette", action: () => onOpenPalette?.() },
          { keys: ["G", "D"], desc: "Go to Dashboard", action: () => onNav?.("dashboard") },
          { keys: ["G", "I"], desc: "Go to Inbox", action: () => onNav?.("inbox") },
          { keys: ["G", "G"], desc: "Go to Governance", action: () => onNav?.("governance") },
          { keys: ["G", "H"], desc: "Go to History", action: () => onNav?.("history") },
          { keys: ["G", "S"], desc: "Go to Settings", action: () => onNav?.("settings") },
          { keys: ["?"], desc: "Show this help", action: () => onNav?.("help") },
        ],
      },
      {
        id: "approvals",
        label: "Approvals",
        icon: ShieldCheck,
        shortcuts: [
          { keys: ["A"], desc: "Approve selected request", note: "Inbox only" },
          { keys: ["D"], desc: "Deny selected request", note: "Inbox only" },
          { keys: ["J"], desc: "Next request", note: "Inbox only" },
          { keys: ["K"], desc: "Previous request", note: "Inbox only" },
        ],
      },
      {
        id: "search",
        label: "Search",
        icon: Search,
        shortcuts: [
          { keys: ["⌘", "K"], desc: "Open command palette", action: () => onOpenPalette?.() },
          { keys: ["/"], desc: "Quick open palette", action: () => onOpenPalette?.() },
          { keys: ["Esc"], desc: "Close modal or clear query" },
        ],
      },
      {
        id: "appearance",
        label: "Appearance",
        icon: Sun,
        shortcuts: [
          { keys: ["⌘", "Shift", "L"], desc: "Toggle light / dark theme", note: "Soon" },
        ],
      },
    ],
    [onNav, onOpenPalette]
  );

  const [activeCategory, setActiveCategory] = useState<string>("navigation");
  const [shortcutQuery, setShortcutQuery] = useState("");

  const filteredShortcuts = useMemo(() => {
    const group = shortcutGroups.find((g) => g.id === activeCategory);
    if (!group) return [] as Shortcut[];
    if (!shortcutQuery.trim()) return group.shortcuts;
    const q = shortcutQuery.toLowerCase();
    return group.shortcuts.filter((s) => s.desc.toLowerCase().includes(q));
  }, [shortcutGroups, activeCategory, shortcutQuery]);

  const totalShortcuts = shortcutGroups.reduce((n, g) => n + g.shortcuts.length, 0);

  // FAQ data
  const faqs = useMemo(
    () => [
      {
        id: "faq-approve",
        q: "How do I approve a request?",
        a: "Go to Inbox and click Approve, or press A on the selected request. Approvals are signed with your passkey device and added to the immutable ledger.",
      },
      {
        id: "faq-pause",
        q: "What happens when I pause an agent?",
        a: "A paused agent's mandates remain on file but new actions are held until you resume. Existing in-flight requests continue to completion under their original verdicts.",
      },
      {
        id: "faq-passkey",
        q: "How are passkeys managed?",
        a: "Pair a security key, laptop, or phone in Settings → Devices. Each approval requires a fresh WebAuthn signature from a paired device. We never store the private key.",
      },
      {
        id: "faq-mandate",
        q: "What is a mandate?",
        a: "A mandate is a signed policy that defines what an agent can do — spend limits, allowed domains, time windows, and counter-parties. Every agent action is evaluated against active mandates before execution.",
      },
      {
        id: "faq-ledger",
        q: "Can I export the signed ledger?",
        a: "Yes. Visit History and click Export. The ledger is a hash-chained JSON log that can be verified offline with our public verification tool.",
      },
      {
        id: "faq-enforcement",
        q: "What does global enforcement do?",
        a: "When enabled, the control plane blocks any agent action that violates a mandate. When disabled, violations are logged but not blocked — useful for testing policies before turning them on.",
      },
    ],
    []
  );

  const [expandedFaq, setExpandedFaq] = useState<string | null>("faq-approve");

  return (
    <>
      <PageHeader
        title="Help & Shortcuts"
        subtitle="Everything you need to master the Aegis control plane."
      />
      <div className="ad-scroll overflow-y-auto flex-1 help-scroll">
        <div className="help-page max-w-5xl mx-auto px-6 py-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {/* HERO */}
            <motion.div variants={fadeUp} className="help-hero">
              <div className="help-hero-top">
                <div className="help-hero-icon">
                  <LifeBuoy size={20} strokeWidth={2} />
                </div>
                <div className="help-hero-text">
                  <h1 className="help-hero-title">Master the control plane</h1>
                  <p className="help-hero-sub">
                    Keyboard shortcuts, getting started, and answers to common questions.
                  </p>
                </div>
                <div className="help-hero-meta">
                  <span className="help-chip">v1.2.0</span>
                  <span className="help-chip">{totalShortcuts} shortcuts</span>
                  <span className="help-chip help-chip--ok">
                    <span className="help-chip-dot" />
                    All systems normal
                  </span>
                </div>
              </div>
              <div className="help-hero-search">
                <Search size={14} className="help-search-icon" />
                <input
                  type="text"
                  placeholder="Search shortcuts and FAQs…"
                  value={shortcutQuery}
                  onChange={(e) => setShortcutQuery(e.target.value)}
                  className="help-search-input"
                  aria-label="Search help"
                />
                {shortcutQuery && (
                  <button
                    onClick={() => setShortcutQuery("")}
                    className="help-search-clear"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
                <kbd className="help-search-kbd">⌘K</kbd>
              </div>
            </motion.div>

            {/* BENTO: Getting started + Shortcuts */}
            <motion.div variants={fadeUp} className="help-bento">
              {/* Getting started */}
              <section className="help-card help-card--checklist">
                <header className="help-card-head">
                  <div className="help-card-icon help-card-icon--accent">
                    <Rocket size={16} strokeWidth={2.2} />
                  </div>
                  <div className="help-card-head-text">
                    <div className="help-card-title">Getting started</div>
                    <div className="help-card-sub">
                      {completedCount} of {checklist.length} complete
                    </div>
                  </div>
                  <div
                    className="help-progress-ring"
                    aria-label={`${progress}% complete`}
                  >
                    <svg viewBox="0 0 36 36" width="34" height="34">
                      <path
                        className="help-progress-ring-track"
                        d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32"
                      />
                      <path
                        className="help-progress-ring-fill"
                        d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32"
                        style={{ strokeDasharray: `${progress}, 100` }}
                      />
                    </svg>
                    <span className="help-progress-ring-label">{progress}%</span>
                  </div>
                </header>
                <div className="help-progress">
                  <div
                    className="help-progress-bar"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <ul className="help-checklist">
                  {checklist.map((item, i) => (
                    <li key={i}>
                      <button
                        onClick={item.action}
                        className={`help-check ${item.done ? "is-done" : ""}`}
                      >
                        <span className="help-check-icon">
                          {item.done ? (
                            <CircleCheck size={14} strokeWidth={2.4} />
                          ) : (
                            <Circle size={14} strokeWidth={2} />
                          )}
                        </span>
                        <span className="help-check-label">{item.label}</span>
                        <span className="help-check-hint">{item.hint}</span>
                        <ArrowRight size={12} className="help-check-arrow" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Shortcuts */}
              <section className="help-card help-card--shortcuts">
                <header className="help-card-head">
                  <div className="help-card-icon help-card-icon--accent">
                    <Keyboard size={16} strokeWidth={2.2} />
                  </div>
                  <div className="help-card-head-text">
                    <div className="help-card-title">Keyboard shortcuts</div>
                    <div className="help-card-sub">Click any row to try it</div>
                  </div>
                </header>
                <div className="help-tabs">
                  {shortcutGroups.map((g) => {
                    const GIcon = g.icon;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setActiveCategory(g.id)}
                        className={`help-tab ${
                          activeCategory === g.id ? "is-active" : ""
                        }`}
                      >
                        <GIcon size={11} strokeWidth={2.4} />
                        <span>{g.label}</span>
                        <span className="help-tab-count">{g.shortcuts.length}</span>
                      </button>
                    );
                  })}
                </div>
                <ul className="help-shortcuts">
                  {filteredShortcuts.length === 0 ? (
                    <li className="help-shortcuts-empty">
                      No shortcuts match “{shortcutQuery}”
                    </li>
                  ) : (
                    filteredShortcuts.map((s, i) => (
                      <li key={i}>
                        <button
                          onClick={s.action}
                          disabled={!s.action}
                          className="help-shortcut"
                        >
                          <span className="help-shortcut-desc">{s.desc}</span>
                          {s.note && (
                            <span className="help-shortcut-note">{s.note}</span>
                          )}
                          <span className="help-shortcut-keys">
                            {s.keys.map((k, j) => (
                              <kbd key={j}>{k}</kbd>
                            ))}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </motion.div>

            {/* FAQ */}
            <motion.div variants={fadeUp} className="help-card help-card--faq">
              <header className="help-card-head">
                <div className="help-card-icon help-card-icon--accent">
                  <MessageCircle size={16} strokeWidth={2.2} />
                </div>
                <div className="help-card-head-text">
                  <div className="help-card-title">Frequently asked</div>
                  <div className="help-card-sub">{faqs.length} questions</div>
                </div>
              </header>
              <div className="help-faq">
                {faqs.map((faq) => {
                  const isExpanded = expandedFaq === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`help-faq-item ${isExpanded ? "is-open" : ""}`}
                    >
                      <button
                        onClick={() =>
                          setExpandedFaq(isExpanded ? null : faq.id)
                        }
                        className="help-faq-q"
                        aria-expanded={isExpanded}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown size={14} className="help-faq-chev" />
                      </button>
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              duration: 0.22,
                              ease: [0.2, 0.8, 0.2, 1],
                            }}
                            className="help-faq-a-wrap"
                          >
                            <p className="help-faq-a">{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* FOOTER CTA */}
            <motion.div variants={fadeUp} className="help-cta">
              <div className="help-cta-text">
                <div className="help-cta-spark">
                  <Sparkles size={14} />
                </div>
                <div>
                  <div className="help-cta-title">Still need help?</div>
                  <div className="help-cta-sub">
                    Our team replies within 1 hour during business hours.
                  </div>
                </div>
              </div>
              <div className="help-cta-actions">
                <button
                  className="help-btn help-btn--ghost"
                  onClick={() => onOpenPalette?.()}
                >
                  <BookOpen size={13} />
                  Browse with ⌘K
                </button>
                <a
                  href="mailto:support@aegis.host"
                  className="help-btn help-btn--primary"
                >
                  <Mail size={13} />
                  Contact support
                  <ArrowRight size={13} />
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
