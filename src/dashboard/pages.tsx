import { useMemo, useState, useCallback, useEffect } from "react";
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
  Trash2, Server, Settings, MoreHorizontal,
  ChevronDown, Sun, Fingerprint, Bell,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import {
  useStore, verdictTone, timeAgo, money,
  type Provider, type Device, type LedgerEntry,
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
        <Card className="lg:col-span-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300/40 dark:hover:border-zinc-800/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Spend over time</CardTitle>
            <CardDescription className="text-xs">Cumulative spend across mandates over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <SpendTrendChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300/40 dark:hover:border-zinc-800/50">
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
        <Card className="lg:col-span-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300/40 dark:hover:border-zinc-800/50">
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
                      className="h-full rounded-full transition-all duration-500"
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
        <Card className="lg:col-span-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300/40 dark:hover:border-zinc-800/50">
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
        <Card className="lg:col-span-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300/40 dark:hover:border-zinc-800/50">
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
    <Card className="relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300/40 dark:hover:border-zinc-800/50 flex flex-col justify-between">
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
        <ResponsiveContainer width="100%" height="100%">
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
        actions={<Button variant="default" size="sm" className="h-8 gap-1.5" onClick={() => setComposerOpen(true)}><Plus size={14} /> New mandate</Button>}
      />
      <div className="ad-scroll overflow-y-auto flex-1 p-6">
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={stagger} initial="hidden" animate="visible">
          {agents.map((a) => {
            const pct = Math.min(100, (a.spendUsed / a.spendLimit) * 100);
            return (
              <motion.div key={a.id} variants={fadeUp} className="w-full">
                <Card className="bg-card text-card-foreground border-border shadow-none overflow-hidden relative transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300/40 dark:hover:border-zinc-800/50">
                  {/* Custom Glass Stripe Header */}
                  <div className="flex items-center gap-3 p-4 bg-muted/40 border-b border-border">
                    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground border border-border">
                      <Cpu size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-card-foreground">{a.name}</span>
                        <Chip tone={statusTone(a.status) as "ok" | "warn" | "bad"} dot>{a.status}</Chip>
                      </div>
                      <div className="mono text-[10px] text-muted-foreground mt-0.5 overflow-hidden text-overflow-ellipsis whitespace-nowrap">{a.did}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] text-muted-foreground font-medium">Enforce</span>
                      <Toggle on={a.enforcement} onClick={() => toggleAgentEnforcement(a.id)} label={`enforcement for ${a.name}`} />
                    </div>
                  </div>

                  <CardContent className="p-4 flex flex-col gap-4">
                    <div className="flex gap-6">
                      <Metric label="Tasks run" value={a.tasks.toLocaleString()} />
                      <Metric label="Spend" value={`${money(a.spendUsed)} / ${money(a.spendLimit)}`} />
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200/50 dark:bg-zinc-800/80">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
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

                    <div>
                      <div className="text-[10px] text-muted-foreground text-uppercase tracking-wider font-semibold mb-2">Mandates</div>
                      <div className="flex flex-wrap gap-1.5">
                        {a.mandates.map((m) => (
                          <span key={m.id} className="inline-flex items-center gap-1.5 text-xs text-card-foreground bg-muted border border-border rounded-full px-2.5 py-1" title={m.detail}>
                            <KeyRound size={10} className="text-muted-foreground" />
                            {m.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0 flex gap-2 border-t border-border/40 mt-1 pt-3.5">
                    {a.status === "active" ? (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setAgentStatus(a.id, "paused")}><Pause size={12} />Pause</Button>
                    ) : a.status === "paused" ? (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setAgentStatus(a.id, "active")}><Play size={12} />Resume</Button>
                    ) : (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setAgentStatus(a.id, "active")}><Play size={12} />Reactivate</Button>
                    )}
                    {a.status !== "revoked" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-1 ml-auto" onClick={() => setAgentStatus(a.id, "revoked")}><Ban size={12} />Revoke</Button>
                    )}
                  </CardFooter>
                </Card>
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
      <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
      <div className="mono font-semibold text-xs tabular-nums text-card-foreground">{value}</div>
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
                    className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all duration-150 cursor-pointer ${selected ? "bg-muted border-border ring-1 ring-inset ring-foreground/15" : "bg-card border-border/40 hover:border-border"}`}
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
                className={`h-7 px-3 text-xs font-semibold rounded-md transition-all duration-150 relative cursor-pointer border-none bg-transparent ${active ? "text-card-foreground" : "text-muted-foreground hover:text-card-foreground"}`}
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
                    className={`hover:bg-muted/40 transition-colors duration-150 ${index % 2 === 0 ? "bg-transparent" : "bg-muted/10"}`}
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
                      className="p-3 text-right text-xs text-muted-foreground mono cursor-pointer hover:underline"
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

export function ProvidersPage() {
  const { providers, toggleProvider, toast } = useStore();
  const connected = providers.filter((p) => p.connected).length;
  return (
    <>
      <PageHeader
        title="Providers"
        subtitle={`${connected} of ${providers.length} connected — credentials stay vaulted, never exposed to the agent.`}
        actions={<Button variant="default" size="sm" className="h-8 gap-1.5" onClick={() => toast("Browse the provider catalog", "info")}><Plus size={14} /> Connect new</Button>}
      />
      <div className="ad-scroll overflow-y-auto flex-1 p-6">
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={stagger} initial="hidden" animate="visible">
          {providers.map((p) => (
            <motion.div key={p.id} variants={fadeUp} className="w-full flex">
              <Card
                className={`bg-card text-card-foreground shadow-none p-4 w-full relative transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300/40 dark:hover:border-zinc-800/50 ${p.connected ? "border-foreground" : "border-border"}`}
              >
                <div className="flex items-center justify-between gap-4 w-full">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative border border-border ${p.connected ? "bg-card-foreground text-card" : "bg-muted text-muted-foreground"}`}>
                      {provIcon(p.category)}
                      {p.connected && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center border border-card">
                          <Check size={8} strokeWidth={3.5} />
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-card-foreground leading-none">{p.name}</div>
                      <div className="text-xs text-muted-foreground mt-1.5 leading-normal">{p.desc}</div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {p.connected ? (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 px-2.5" onClick={() => toggleProvider(p.id)}>Disconnect</Button>
                    ) : (
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" onClick={() => toggleProvider(p.id)}>Connect</Button>
                    )}
                  </div>
                </div>
              </Card>
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
        actions={<Btn variant="primary" icon={<Plus size={15} />} onClick={() => addDevice("New passkey · " + new Date().toLocaleTimeString(), "security-key")}>Link device</Btn>}
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
              <motion.div key={d.id} variants={fadeUp} className="ad-row hover:-translate-y-0.5 hover:shadow-md hover:border-primary/45 transition-all duration-300 group" style={{ transitionProperty: "transform, box-shadow, border-color" }}>
                <span className="ad-row-ico group-hover:text-primary transition-colors">{devIcon(d.kind)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ad-row-name group-hover:text-primary transition-colors" style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
          <motion.section variants={fadeUp} className="ad-card pad hover:-translate-y-0.5 hover:shadow-md hover:border-primary/45 transition-all duration-300 group" style={{ transitionProperty: "transform, box-shadow, border-color" }}>
            <div className="ad-section-title group-hover:text-primary transition-colors"><ShieldCheck size={15} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />Enforcement</div>
            <div className="ad-section-sub">When on, every action is checked against its mandate before it runs.</div>
            <div className="ad-row hover:border-primary/30 transition-all duration-200" style={{ background: "transparent", border: "1px solid var(--d-line)" }}>
              <div style={{ flex: 1 }}>
                <div className="ad-row-name">Global enforcement</div>
                <div className="ad-row-desc">{settings.enforcement ? "Active — policies are enforced." : "Off — testing mode, nothing is blocked."}</div>
              </div>
              <Toggle on={settings.enforcement} onClick={() => updateSettings({ enforcement: !settings.enforcement })} label="global enforcement" />
            </div>
            <div style={{ marginTop: 14 }}>
              <label className="ad-field-label">Step-up threshold (USD)</label>
              <input className="ad-input active:scale-[0.99] transition-transform duration-100" type="number" value={settings.stepUpThreshold} onChange={(e) => updateSettings({ stepUpThreshold: Number(e.target.value) || 0 })} style={{ maxWidth: 200 }} />
            </div>
          </motion.section>

          <motion.section variants={fadeUp} className="ad-card pad hover:-translate-y-0.5 hover:shadow-md hover:border-primary/45 transition-all duration-300 group" style={{ transitionProperty: "transform, box-shadow, border-color" }}>
            <div className="ad-section-title group-hover:text-primary transition-colors"><KeyRound size={15} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />License</div>
            <div className="ad-section-sub">Activate a key to enable enforcement in production.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="ad-input active:scale-[0.99] transition-transform duration-100" placeholder="paste your license key" value={key} onChange={(e) => setKey(e.target.value)} />
              <Btn variant="primary" disabled={!key.trim()} onClick={() => { updateSettings({ licenseKey: key.trim() }); toast("License activated", "ok"); }}>Activate</Btn>
            </div>
          </motion.section>

          <motion.section variants={fadeUp} className="ad-card pad hover:-translate-y-0.5 hover:shadow-md hover:border-primary/45 transition-all duration-300 group" style={{ transitionProperty: "transform, box-shadow, border-color" }}>
            <div className="ad-section-title group-hover:text-primary transition-colors"><Server size={15} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />Backend API</div>
            <div className="ad-section-sub">Where the dashboard reaches your control plane.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="ad-input mono active:scale-[0.99] transition-transform duration-100" value={api} onChange={(e) => setApi(e.target.value)} />
              <Btn variant="ghost" onClick={() => { updateSettings({ apiUrl: api }); toast("Endpoint saved", "ok"); }}>Save</Btn>
            </div>
          </motion.section>

          <motion.section variants={fadeUp} className="ad-card pad hover:-translate-y-0.5 hover:shadow-md hover:border-primary/45 transition-all duration-300 group" style={{ transitionProperty: "transform, box-shadow, border-color" }}>
            <div className="ad-section-title group-hover:text-primary transition-colors"><Settings size={15} style={{ verticalAlign: -2, marginRight: 6, color: "var(--d-crimson)" }} />Setup</div>
            <div className="ad-section-sub">Re-run the guided setup wizard.</div>
            <Btn variant="ghost" icon={<Settings size={15} />} onClick={onReopenWizard}>Open setup wizard</Btn>
          </motion.section>
        </motion.div>
      </div>
    </>
  );
}

// ============================================================
// Notifications
// ============================================================
export function NotificationsPage({ onNav }: { onNav: (k: RouteKey) => void }) {
  const { approvals, ledger, toast } = useStore();
  const [read, setRead] = useState<Set<string>>(new Set());
  // System-item timestamps need a stable "now" that's safe to reference from
  // useMemo without calling Date.now() during render.
  const [sysNow] = useState(() => Date.now());

  const notifications = useMemo(() => {
    const items: {
      id: string;
      title: string;
      body: string;
      tone: "ok" | "warn" | "bad" | "info";
      time: number;
      category: string;
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
          className="flex flex-col gap-3 max-w-2xl"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell size={26} />}
              title="All caught up"
            >
              No notifications right now.
            </EmptyState>
          ) : (
            notifications.map(n => {
              const isRead = read.has(n.id);
              const toneClass =
                n.tone === "bad"
                  ? "border-l-red-500 bg-red-500/5"
                  : n.tone === "warn"
                  ? "border-l-amber-500 bg-amber-500/5"
                  : n.tone === "info"
                  ? "border-l-blue-500 bg-blue-500/5"
                  : "border-l-emerald-500 bg-emerald-500/5";

              return (
                <motion.div
                  key={n.id}
                  variants={fadeUp}
                  className={`flex gap-4 p-4 rounded-lg border border-border border-l-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/20 ${toneClass} ${isRead ? "opacity-60" : ""}`}
                  onClick={() => setRead(r => new Set([...r, n.id]))}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {!isRead && <span className="size-1.5 rounded-full bg-blue-500 shrink-0 mt-1" />}
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {n.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                        {timeAgo(n.time)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-card-foreground mt-1">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                    {n.category === "Approval" && (
                      <div className="flex gap-2 mt-3">
                        <Btn
                          variant="ok"
                          onClick={e => {
                            e.stopPropagation();
                            onNav("inbox");
                          }}
                        >
                          Review in Inbox
                        </Btn>
                      </div>
                    )}
                  </div>
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
                className="absolute -bottom-1 -right-1 size-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
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
                  className="text-muted-foreground hover:text-foreground transition-colors"
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

  return (
    <>
      <PageHeader title="Support" subtitle="Documentation, FAQ, and contact." />
      <div className="ad-scroll overflow-y-auto flex-1 p-6">
        <motion.div
          className="flex flex-col gap-6 max-w-2xl"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Status */}
          <motion.div
            variants={fadeUp}
            className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
          >
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              All systems operational
            </span>
            <a
              href="#"
              className="ml-auto text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              onClick={e => {
                e.preventDefault();
                toast("Opening status page", "info");
              }}
            >
              Status page →
            </a>
          </motion.div>

          {/* Quick links */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
            {[
              { label: "Documentation", icon: "📖", desc: "Guides, API reference", action: () => toast("Opening docs", "info") },
              { label: "Discord", icon: "💬", desc: "Community & help", action: () => toast("Opening Discord", "info") },
              { label: "GitHub Issues", icon: "🐙", desc: "Bug reports", action: () => toast("Opening GitHub", "info") },
            ].map(link => (
              <button
                key={link.label}
                onClick={link.action}
                className="ad-card pad text-left hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col gap-2"
              >
                <span className="text-2xl">{link.icon}</span>
                <span className="text-sm font-semibold">{link.label}</span>
                <span className="text-xs text-muted-foreground">{link.desc}</span>
              </button>
            ))}
          </motion.div>

          {/* FAQ */}
          <motion.div variants={fadeUp} className="ad-card pad">
            <div className="ad-section-title">Frequently Asked Questions</div>
            <div className="flex flex-col divide-y divide-border">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <button
                    className="flex items-center justify-between w-full py-3 text-sm font-medium text-left hover:text-foreground transition-colors"
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={14}
                      className={`text-muted-foreground transition-transform duration-200 ${faqOpen === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {faqOpen === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-muted-foreground pb-3 leading-relaxed"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.div variants={fadeUp} className="ad-card pad">
            <div className="ad-section-title">Contact support</div>
            <div className="ad-section-sub">We respond within 24 hours on business days.</div>
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="ad-field-label">Subject</label>
                <input
                  className="ad-input"
                  placeholder="What can we help with?"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="ad-field-label">Message</label>
                <textarea
                  className="ad-input"
                  rows={4}
                  style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                  placeholder="Describe your issue…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>
              <Btn
                variant="primary"
                onClick={() => {
                  if (subject && message) {
                    toast("Message sent — we'll reply within 24h", "ok");
                    setSubject("");
                    setMessage("");
                  } else {
                    toast("Fill in subject and message first", "info");
                  }
                }}
              >
                Send message
              </Btn>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

// ============================================================
// Help & Shortcuts
// ============================================================
export function HelpPage() {
  const shortcuts = [
    { keys: ["⌘", "K"], desc: "Open command palette / search" },
    { keys: ["G", "D"], desc: "Go to Dashboard" },
    { keys: ["G", "I"], desc: "Go to Inbox" },
    { keys: ["G", "G"], desc: "Go to Governance" },
    { keys: ["G", "H"], desc: "Go to History" },
    { keys: ["G", "S"], desc: "Go to Settings" },
    { keys: ["Esc"], desc: "Close modal or overlay" },
    { keys: ["A"], desc: "Approve selected request" },
    { keys: ["D"], desc: "Deny selected request" },
  ];

  const checklist = [
    { done: true, label: "Connect your first agent" },
    { done: true, label: "Create a mandate" },
    { done: false, label: "Link a passkey device" },
    { done: false, label: "Set spend limits" },
    { done: false, label: "Enable global enforcement" },
    { done: false, label: "Invite a team member" },
  ];

  return (
    <>
      <PageHeader title="Help & Shortcuts" subtitle="Keyboard shortcuts, getting started, and quick tips." />
      <div className="ad-scroll overflow-y-auto flex-1 p-6">
        <motion.div
          className="flex flex-col gap-6 max-w-2xl"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Getting started */}
          <motion.div variants={fadeUp} className="ad-card pad">
            <div className="ad-section-title">Getting started checklist</div>
            <div className="flex flex-col gap-2 mt-4">
              {checklist.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 text-sm ${item.done ? "text-muted-foreground" : "text-card-foreground"}`}
                >
                  <span
                    className={`size-5 rounded-full flex items-center justify-center text-[11px] border ${item.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-border bg-transparent"}`}
                  >
                    {item.done ? "✓" : ""}
                  </span>
                  <span className={item.done ? "line-through" : ""}>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Keyboard shortcuts */}
          <motion.div variants={fadeUp} className="ad-card pad">
            <div className="ad-section-title">Keyboard shortcuts</div>
            <div className="flex flex-col gap-1 mt-4">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{s.desc}</span>
                  <div className="flex gap-1">
                    {s.keys.map(k => (
                      <kbd
                        key={k}
                        className="px-2 py-0.5 text-[11px] font-mono border border-border bg-muted rounded-md text-foreground"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tips */}
          <motion.div variants={fadeUp} className="ad-card pad">
            <div className="ad-section-title">Quick tips</div>
            <ul className="flex flex-col gap-2 mt-3">
              {[
                "Click the ledger hash in History to view the full hash-chain proof.",
                "Mandate chips in Governance are clickable — they show the full policy YAML.",
                "The countdown ring in Inbox shows how long until the request auto-expires.",
                "Use ⌘K to search across agents, actions, and pages instantly.",
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-xs text-muted-foreground">
                  <span className="size-4 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
