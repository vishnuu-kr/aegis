import { useEffect, useState } from "react";
import {
  ShieldCheck, LayoutDashboard, Inbox as InboxIcon, History as HistoryIcon,
  Plug, Smartphone, Settings as SettingsIcon, Cpu, Sun, Moon,
} from "lucide-react";
import "./dashboard.css";
import { StoreProvider, useStore } from "./data";
import { Toasts } from "./ui";
import { GovernancePage, OverviewPage, InboxPage, HistoryPage, ProvidersPage, DevicesPage, SettingsPage } from "./pages";
import { Wizard } from "./Wizard";

export type RouteKey =
  | "dashboard" | "governance" | "inbox" | "history" | "providers" | "devices" | "settings";

const ROUTES: RouteKey[] = ["dashboard", "governance", "inbox", "history", "providers", "devices", "settings"];

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

const NAV: { key: RouteKey; label: string; icon: React.ReactNode; group?: "main" | "setup" }[] = [
  { key: "governance", label: "Governance", icon: <ShieldCheck />, group: "main" },
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard />, group: "main" },
  { key: "inbox", label: "Inbox", icon: <InboxIcon />, group: "main" },
  { key: "history", label: "History", icon: <HistoryIcon />, group: "main" },
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
  return (
    <aside className="ad-side">
      <div className="ad-brand">
        <span className="ad-brand-mark"><ShieldCheck size={17} /></span>
        <span className="ad-brand-name">Aegis</span>
      </div>
      <div className="ad-brand-sub">Approvals</div>

      <nav className="ad-nav">
        {NAV.filter((n) => n.group === "main").map((n) => (
          <button key={n.key} className={`ad-nav-item${route === n.key ? " is-active" : ""}`} onClick={() => nav(n.key)}>
            {n.icon}
            <span>{n.label}</span>
            {n.key === "inbox" && approvals.length > 0 && <span className="ad-nav-badge tnum">{approvals.length}</span>}
          </button>
        ))}
        <div className="ad-nav-label">Setup</div>
        {NAV.filter((n) => n.group === "setup").map((n) => (
          <button key={n.key} className={`ad-nav-item${route === n.key ? " is-active" : ""}`} onClick={() => nav(n.key)}>
            {n.icon}
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      <div className="ad-side-foot">
        <button className="ad-theme-toggle" onClick={toggleTheme} type="button">
          {dark ? <Sun /> : <Moon />}
          <span>{dark ? "Light mode" : "Dark mode"}</span>
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
      <main className="ad-main">
        {route === "governance" && <GovernancePage />}
        {route === "dashboard" && <OverviewPage onNav={nav} />}
        {route === "inbox" && <InboxPage />}
        {route === "history" && <HistoryPage />}
        {route === "providers" && <ProvidersPage />}
        {route === "devices" && <DevicesPage />}
        {route === "settings" && <SettingsPage onReopenWizard={() => setWizardOpen(true)} />}
      </main>
      {wizardOpen && <Wizard onClose={finishWizard} onFinish={finishWizard} onNav={nav} />}
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
