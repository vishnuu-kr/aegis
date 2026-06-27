import { useEffect, useState } from "react";
import {
  LayoutDashboard, Plug, Settings as SettingsIcon, Sun, Moon,
  LifeBuoy, ShieldCheck, Inbox as InboxIcon, History as HistoryIcon, Smartphone, Cpu
} from "lucide-react";
import "./dashboard.css";
import { StoreProvider, useStore } from "./data";
import { Toasts } from "./ui";
import { GovernancePage, OverviewPage, InboxPage, HistoryPage, ProvidersPage, DevicesPage, SettingsPage } from "./pages";
import { Wizard } from "./Wizard";
import { AnimatePresence, motion } from "framer-motion";

export type RouteKey =
  | "dashboard" | "governance" | "inbox" | "history" | "providers" | "devices" | "settings" | "support";

const ROUTES: RouteKey[] = ["dashboard", "governance", "inbox", "history", "providers", "devices", "settings", "support"];

export function parseHash(): RouteKey {
  const h = window.location.hash.replace(/^#\/?app\/?/, "").replace(/^#\/?/, "");
  const key = h.split(/[/?]/)[0] as RouteKey;
  return ROUTES.includes(key) ? key : "dashboard";
}

function useHashRoute(): [RouteKey, (k: RouteKey) => void] {
  const [route, setRoute] = useState<RouteKey>(parseHash());
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const nav = (k: RouteKey) => { window.location.hash = `/app/${k}`; };
  return [route, nav];
}

const NAV: { key: RouteKey; label: string; icon: React.ReactNode; group?: "platform" | "setup" }[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard />, group: "platform" },
  { key: "governance", label: "Governance", icon: <ShieldCheck />, group: "platform" },
  { key: "inbox", label: "Inbox", icon: <InboxIcon />, group: "platform" },
  { key: "history", label: "History", icon: <HistoryIcon />, group: "platform" },
  { key: "providers", label: "Providers", icon: <Plug />, group: "setup" },
  { key: "devices", label: "Devices", icon: <Smartphone />, group: "setup" },
  { key: "settings", label: "Settings", icon: <SettingsIcon />, group: "setup" },
];

function useTheme(): [boolean, () => void] {
  const [dark, setDark] = useState(() => document.documentElement.getAttribute("data-theme") === "dark");
  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem("aeg-theme", next ? "dark" : "light"); } catch { /* ignore */ }
  };
  return [dark, toggle];
}

function Sidebar({ route, nav }: { route: RouteKey; nav: (k: RouteKey) => void }) {
  const { approvals } = useStore();
  const [dark, toggleTheme] = useTheme();

  const renderItem = (n: typeof NAV[number]) => {
    const active = route === n.key;
    return (
      <button
        key={n.key}
        title={n.label}
        className={`ad-nav-item${active ? " is-active" : ""}`}
        onClick={() => nav(n.key)}
        style={{ position: "relative", isolation: "isolate" }}
      >
        {active && (
          <motion.div
            layoutId="active-nav-bg"
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--d-soft)",
              borderRadius: "6px",
              zIndex: -1,
            }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        {n.icon}
        <span>{n.label}</span>
        {n.key === "inbox" && approvals.length > 0 && <span className="ad-nav-badge tnum">{approvals.length}</span>}
      </button>
    );
  };

  return (
    <aside className="ad-side" style={{ background: "var(--d-bg-2)", borderRight: "1px solid var(--d-line)" }}>
      {/* Brand Header */}
      <div className="ad-brand" style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "2px" }}>
        <img 
          src={dark ? "/logo_bgremoved_inverted.png" : "/logo_bgremoved.png"} 
          alt="AgentTag Logo" 
          height="24" 
          style={{ height: "24px", width: "auto", filter: dark ? "grayscale(1) brightness(10)" : "grayscale(1) brightness(0)" }} 
          className="brand-logo-img" 
        />
        <span className="ad-brand-name" style={{ textTransform: "none", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--d-ink)", fontSize: "17px" }}>AgentTag</span>
      </div>
      <div className="ad-brand-sub" style={{ fontSize: "12px", color: "var(--d-faint)", margin: "2px 0 18px 8px" }}>Approvals</div>

      <nav className="ad-nav">
        <div className="ad-nav-label" style={{ color: "var(--d-faint)" }}>Platform</div>
        {NAV.filter((n) => n.group === "platform").map(renderItem)}
        
        <div className="ad-nav-label" style={{ color: "var(--d-faint)" }}>Setup</div>
        {NAV.filter((n) => n.group === "setup").map(renderItem)}
      </nav>



      <div className="ad-side-foot">
        <button className="ad-theme-toggle" onClick={toggleTheme} type="button" style={{ position: "relative", overflow: "hidden", marginBottom: "4px" }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={dark ? "dark" : "light"}
              initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 9 }}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
              <span>{dark ? "Light mode" : "Dark mode"}</span>
            </motion.span>
          </AnimatePresence>
        </button>

        <button
          className={`ad-nav-item${route === "support" ? " is-active" : ""}`}
          onClick={() => nav("support")}
          style={{ padding: "8px 10px", marginBottom: "8px" }}
        >
          <LifeBuoy size={16} />
          <span>Support</span>
        </button>

        <div className="ad-agentcard">
          <span className="av"><Cpu size={16} /></span>
          <div>
            <b>Aegis Agent</b>
            <span className="mono">did:key:z6MkvS…W8X23b</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Shell() {
  const [route, nav] = useHashRoute();
  const [wizardOpen, setWizardOpen] = useState(() => localStorage.getItem("aeg-dash-wizard-done") !== "1");

  const finishWizard = () => {
    localStorage.setItem("aeg-dash-wizard-done", "1");
    localStorage.removeItem("aeg-dash-wizard-step");
    setWizardOpen(false);
  };

  // Keep the URL canonical when landing on bare #/app.
  useEffect(() => {
    if (!/\/app\//.test(window.location.hash)) window.location.hash = `/app/${route}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="aeg-dash">
      <Sidebar route={route} nav={nav} />
      <main className="ad-main" style={{ position: "relative", overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, height: "100%" }}
          >
            {route === "governance" && <GovernancePage />}
            {(route === "dashboard" || route === "support") && <OverviewPage onNav={nav} />}
            {route === "inbox" && <InboxPage onNav={nav} />}
            {route === "history" && <HistoryPage />}
            {route === "providers" && <ProvidersPage />}
            {route === "devices" && <DevicesPage />}
            {route === "settings" && <SettingsPage onReopenWizard={() => setWizardOpen(true)} />}
          </motion.div>
        </AnimatePresence>
      </main>
      <AnimatePresence>
        {wizardOpen && <Wizard onClose={finishWizard} onFinish={finishWizard} onNav={nav} />}
      </AnimatePresence>
      <Toasts />
    </div>
  );
}

export default function Dashboard() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
