import { useState, useRef, useCallback, useEffect, useId } from "react";
import { useStore } from "./data";
import { AnimatePresence, motion } from "framer-motion";
import {
  DollarSign, Eye, UserCheck, ShieldCheck, Check, X, Fingerprint,
} from "lucide-react";

type BtnVariant = "primary" | "ghost" | "subtle" | "danger" | "ok";

export function Btn({
  children,
  variant = "subtle",
  sm,
  block,
  icon,
  ...rest
}: {
  children: React.ReactNode;
  variant?: BtnVariant;
  sm?: boolean;
  block?: boolean;
  icon?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`ad-btn ad-btn-${variant}${sm ? " sm" : ""}${block ? " block" : ""}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconBtn({
  children,
  ...rest
}: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="ad-iconbtn" {...rest}>
      {children}
    </button>
  );
}

export type ChipTone = "ok" | "warn" | "bad" | "info" | "muted";
export function Chip({ tone = "muted", dot, children }: { tone?: ChipTone; dot?: boolean; children: React.ReactNode }) {
  return (
    <span className={`ad-chip ${tone}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      className={`ad-toggle${on ? " on" : ""}`}
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={label || "toggle"}
      type="button"
    />
  );
}

export function StatCard({
  label,
  value,
  icon,
  delta,
  deltaTone = "ok",
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  delta?: string;
  deltaTone?: "ok" | "bad" | "muted";
}) {
  const deltaColor = deltaTone === "ok" ? "var(--d-ok)" : deltaTone === "bad" ? "var(--d-bad)" : "var(--d-faint)";
  return (
    <div className="ad-card pad ad-rise">
      <div className="ad-stat-label">
        <span className="ad-stat-ico">{icon}</span>
        {label}
      </div>
      <div className="ad-stat-value tnum">{value}</div>
      {delta && <div className="ad-stat-delta" style={{ color: deltaColor }}>{delta}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="ad-empty">
      <div className="ico">{icon}</div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="ad-topbar">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="ad-topbar-actions">{actions}</div>}
    </div>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="ad-toasts">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`ad-toast ${t.tone}`}
            onClick={() => dismissToast(t.id)}
            style={{ cursor: "pointer" }}
            initial={{ opacity: 0, x: 24, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", duration: 0.32, bounce: 0 }}
          >
            <span className="bar" />
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Interactive SVG Area Chart
// ============================================================
interface ChartPoint { label: string; value: number }

export function InteractiveChart({
  data,
  height = 160,
  color = "var(--d-ink)",
  unit = "",
}: {
  data: ChartPoint[];
  height?: number;
  color?: string;
  unit?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; point: ChartPoint } | null>(null);

  const padding = { top: 10, right: 8, bottom: 4, left: 8 };
  const w = 400;
  const h = height;
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;

  const maxV = Math.max(...data.map((d) => d.value), 1);
  const minV = Math.min(...data.map((d) => d.value), 0);
  const range = maxV - minV || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * plotW,
    y: padding.top + plotH - ((d.value - minV) / range) * plotH,
    ...d,
  }));

  const linePath = points.map((p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = points[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 3;
    const cp1y = prev.y;
    const cp2x = p.x - (p.x - prev.x) / 3;
    const cp2y = p.y;
    return `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x},${p.y}`;
  }).join(" ");
  
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},${h} L ${points[0].x},${h} Z`
    : "";

  const uniqueId = useId();
  const gradId = `chart-grad-${uniqueId.replace(/:/g, "")}`;

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!wrapRef.current || points.length === 0) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * w;
      let closest = points[0];
      let minDist = Infinity;
      for (const p of points) {
        const dist = Math.abs(p.x - mx);
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      }
      const px = (closest.x / w) * rect.width;
      const py = (closest.y / h) * rect.height;
      setHover({ x: px, y: py, point: closest });
    },
    [points, w, h]
  );

  return (
    <div className="ad-chart-wrap" ref={wrapRef} onMouseMove={onMouseMove} onMouseLeave={() => setHover(null)} style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {points.length > 1 && (
          <>
            <path d={areaPath} fill={`url(#${gradId})`} />
            {/* Glowing neon laser background blur path */}
            <path d={linePath} fill="none" stroke={color} strokeWidth="5" opacity="0.22" strokeLinejoin="round" strokeLinecap="round" style={{ filter: "blur(2.5px)" }} />
            {/* Main foreground path */}
            <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </>
        )}
        {hover && (
          <circle
            className="ad-chart-dot visible"
            cx={points.find((p) => p.label === hover.point.label)?.x}
            cy={points.find((p) => p.label === hover.point.label)?.y}
            r="4"
            fill={color}
            stroke="var(--d-panel)"
            strokeWidth="2"
          />
        )}
      </svg>
      {hover && (
        <div
          className="ad-chart-tooltip visible"
          style={{ left: hover.x, top: hover.y }}
        >
          <div className="label">{hover.point.label}</div>
          <div>{unit}{hover.point.value.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Countdown Ring
// ============================================================
export function CountdownRing({ remaining, total }: { remaining: number; total: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, remaining / total));
  const offset = circ * (1 - pct);

  const formatTime = (rem: number) => {
    if (rem <= 0) return "0s";
    if (rem < 60) return `${rem}s`;
    return `${Math.ceil(rem / 60)}m`;
  };

  return (
    <div className="ad-countdown-ring">
      <svg viewBox="0 0 36 36">
        <circle className="track" cx="18" cy="18" r={r} />
        <circle className="progress" cx="18" cy="18" r={r} strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <span className="time">{formatTime(remaining)}</span>
    </div>
  );
}

// ============================================================
// JSON Tree Viewer
// ============================================================
export function JsonTree({ data }: { data: Record<string, unknown> }) {
  const format = (obj: unknown, indent: number): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    const pad = "  ".repeat(indent);
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      const entries = Object.entries(obj);
      entries.forEach(([k, v], i) => {
        const comma = i < entries.length - 1 ? "," : "";
        if (typeof v === "string") {
          nodes.push(<span key={`${indent}-${k}`}>{pad}<span className="key">"{k}"</span>: <span className="str">"{v}"</span>{comma}{"\n"}</span>);
        } else if (typeof v === "number") {
          nodes.push(<span key={`${indent}-${k}`}>{pad}<span className="key">"{k}"</span>: <span className="num">{v}</span>{comma}{"\n"}</span>);
        } else if (typeof v === "boolean") {
          nodes.push(<span key={`${indent}-${k}`}>{pad}<span className="key">"{k}"</span>: <span className="bool">{v ? "true" : "false"}</span>{comma}{"\n"}</span>);
        } else if (typeof v === "object" && v !== null) {
          nodes.push(<span key={`${indent}-${k}-open`}>{pad}<span className="key">"{k}"</span>: {"{"}{"\n"}</span>);
          nodes.push(...format(v, indent + 1));
          nodes.push(<span key={`${indent}-${k}-close`}>{pad}{"}"}{comma}{"\n"}</span>);
        }
      });
    }
    return nodes;
  };

  return (
    <div className="ad-json-tree">
      {"{\n"}
      {format(data, 1)}
      {"}"}
    </div>
  );
}

// ============================================================
// Policy Composer Modal
// ============================================================
type ComposerStep = "template" | "configure" | "signing" | "done";

const TEMPLATES = [
  { id: "spend", label: "Spending Cap", desc: "Limit monthly API spend per agent", icon: <DollarSign size={20} /> },
  { id: "readonly", label: "Read-Only", desc: "Allow reads, block all mutations", icon: <Eye size={20} /> },
  { id: "stepup", label: "Step-Up Auth", desc: "Require human approval above threshold", icon: <UserCheck size={20} /> },
] as const;

const SIGN_STEPS = ["Hashing policy payload…", "Applying local signing key…", "Verifying chain integrity…", "Appending to mandate ledger…"];

export function PolicyComposer({ onClose, onSubmit }: { onClose: () => void; onSubmit: (template: string, name: string, limit: number) => void }) {
  const [step, setStep] = useState<ComposerStep>("template");
  const [tmpl, setTmpl] = useState<string>("spend");
  const [name, setName] = useState("");
  const [limit, setLimit] = useState(500);
  const [signIdx, setSignIdx] = useState(0);

  useEffect(() => {
    if (step === "signing") {
      const id = setInterval(() => {
        setSignIdx((prev) => {
          if (prev >= SIGN_STEPS.length - 1) {
            clearInterval(id);
            setTimeout(() => setStep("done"), 600);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
      return () => clearInterval(id);
    }
  }, [step]);

  const handleSign = () => {
    setSignIdx(0);
    setStep("signing");
  };

  const handleFinish = () => {
    onSubmit(tmpl, name || TEMPLATES.find((t) => t.id === tmpl)?.label || "Policy", limit);
    onClose();
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
        className="ad-composer"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="ad-composer-header">
          <h2><ShieldCheck size={18} style={{ verticalAlign: -3, marginRight: 8 }} />New Mandate</h2>
          <button className="ad-iconbtn" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <AnimatePresence mode="wait">
          {step === "template" && (
            <motion.div key="tmpl" className="ad-composer-body" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}>
              <div style={{ fontSize: 13, color: "var(--d-muted)", marginBottom: 4 }}>Choose a policy template</div>
              <div className="ad-template-grid">
                {TEMPLATES.map((t) => (
                  <button key={t.id} className={`ad-template-card${tmpl === t.id ? " selected" : ""}`} onClick={() => setTmpl(t.id)} type="button">
                    <span className="ico">{t.icon}</span>
                    <span className="title">{t.label}</span>
                    <span className="desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "configure" && (
            <motion.div key="cfg" className="ad-composer-body" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}>
              <div>
                <label className="ad-field-label">Mandate name</label>
                <input className="ad-input" placeholder={TEMPLATES.find((t) => t.id === tmpl)?.label} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="ad-field-label">
                  {tmpl === "spend" ? "Monthly limit (USD)" : tmpl === "stepup" ? "Step-up threshold (USD)" : "Max read operations / day"}
                </label>
                <input className="ad-input" type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value) || 0)} style={{ maxWidth: 220 }} />
              </div>
              <div style={{ background: "var(--d-soft)", borderRadius: "var(--d-r-sm)", padding: "14px 16px", fontSize: 12, color: "var(--d-muted)", lineHeight: 1.6 }}>
                <div style={{ fontWeight: 650, marginBottom: 4, color: "var(--d-ink)" }}>Policy summary</div>
                Template: <strong>{TEMPLATES.find((t) => t.id === tmpl)?.label}</strong><br />
                Applies to: All governed agents<br />
                Limit: <strong>${limit.toLocaleString()}</strong>
              </div>
            </motion.div>
          )}

          {step === "signing" && (
            <motion.div key="sign" className="ad-composer-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <div className="ad-sign-progress">
                <div className="ad-sign-spinner" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={signIdx}
                    className="ad-sign-step"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    {SIGN_STEPS[signIdx]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done" className="ad-composer-body" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="ad-sign-progress">
                <motion.div
                  className="ad-sign-done"
                  initial={{ scale: 0.25, opacity: 0, rotate: 80, filter: "blur(8px)" }}
                  animate={{ scale: 1, opacity: 1, rotate: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, ease: [0.34, 1.35, 0.64, 1] }}
                >
                  <Check size={24} />
                </motion.div>
                <div style={{ fontWeight: 650, fontSize: 16, color: "var(--d-ink)" }}>Mandate signed successfully</div>
                <div style={{ fontSize: 13, color: "var(--d-muted)" }}>Hash-chained to your audit ledger.</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="ad-composer-foot">
          {step === "template" && (
            <>
              <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
              <Btn variant="primary" onClick={() => setStep("configure")}>Continue</Btn>
            </>
          )}
          {step === "configure" && (
            <>
              <Btn variant="ghost" onClick={() => setStep("template")}>Back</Btn>
              <Btn variant="primary" icon={<ShieldCheck size={15} />} onClick={handleSign}>Sign &amp; deploy</Btn>
            </>
          )}
          {step === "done" && (
            <Btn variant="primary" onClick={handleFinish}>Done</Btn>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Biometric Verification Overlay
// ============================================================
export function BiometricOverlay({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"scanning" | "success">("scanning");

  useEffect(() => {
    const t = setTimeout(() => setPhase("success"), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === "success") {
      const t = setTimeout(onComplete, 1000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  return (
    <motion.div
      className="ad-bio-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="ad-bio-card"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait">
          {phase === "scanning" ? (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div className="ad-bio-fingerprint">
                <Fingerprint size={28} />
              </div>
              <div style={{ fontWeight: 650, fontSize: 15, color: "var(--d-ink)" }}>Verifying identity</div>
              <div style={{ fontSize: 13, color: "var(--d-muted)" }}>Authenticating with device passkey…</div>
            </motion.div>
          ) : (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <motion.div
                className="ad-bio-fingerprint success"
                initial={{ scale: 0.25, opacity: 0, rotate: 80, filter: "blur(8px)" }}
                animate={{ scale: 1, opacity: 1, rotate: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: [0.34, 1.35, 0.64, 1] }}
              >
                <Check size={28} />
              </motion.div>
              <div style={{ fontWeight: 650, fontSize: 15, color: "var(--d-ink)" }}>Approved</div>
              <div style={{ fontSize: 13, color: "var(--d-muted)" }}>Cryptographic signature applied.</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

