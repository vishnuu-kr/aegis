import { useStore } from "./data";

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
  const { toasts } = useStore();
  if (!toasts.length) return null;
  return (
    <div className="ad-toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`ad-toast ${t.tone}`}>
          <span className="bar" />
          {t.msg}
        </div>
      ))}
    </div>
  );
}
