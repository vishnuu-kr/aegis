/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Plug, Settings as SettingsIcon, Sun, Moon,
  LifeBuoy, ShieldCheck, Inbox as InboxIcon, History as HistoryIcon,
  Smartphone, Cpu, Plus, HelpCircle, Bell, Search, ChevronsUpDown,
} from "lucide-react";
import "./dashboard.css";
import { StoreProvider, useStore } from "./data";
import { Toasts } from "./ui";
import { GovernancePage, OverviewPage, InboxPage, HistoryPage, ProvidersPage, DevicesPage, SettingsPage, NotificationsPage, ProfilePage, SupportPage, HelpPage } from "./pages";
import { Wizard } from "./Wizard";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LedgerEntry } from "./data";

export type RouteKey =
  | "dashboard" | "governance" | "inbox" | "history" | "providers" | "devices" | "settings" | "support"
  | "notifications" | "profile" | "help";

const ROUTES: RouteKey[] = [
  "dashboard", "governance", "inbox", "history", "providers", "devices", "settings", "support",
  "notifications", "profile", "help",
];

const ROUTE_LABEL: Record<RouteKey, string> = {
  dashboard: "Dashboard", inbox: "Inbox", governance: "Governance", history: "History",
  providers: "Providers", devices: "Devices", settings: "Settings", support: "Support",
  notifications: "Notifications", profile: "Profile", help: "Help & Shortcuts",
};

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

type NavItem = { key: RouteKey; label: string; icon: React.ReactNode; group: "today" | "setup" };

const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard />, group: "today" },
  { key: "inbox", label: "Inbox", icon: <InboxIcon />, group: "today" },
  { key: "governance", label: "Governance", icon: <ShieldCheck />, group: "today" },
  { key: "history", label: "History", icon: <HistoryIcon />, group: "today" },
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

// ============================================================
// Search Modal
// ============================================================
function SearchModal({ open, onClose, nav, ledger }: {
  open: boolean;
  onClose: () => void;
  nav: (k: RouteKey) => void;
  ledger: LedgerEntry[];
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Reset query when modal opens
  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const results = q.trim() === "" ? [] : ledger
    .filter(e => (e.action + " " + e.agent).toLowerCase().includes(q.toLowerCase()))
    .slice(0, 5);

  const QUICK_LINKS: { label: string; key: RouteKey; icon: string }[] = [
    { label: "Dashboard", key: "dashboard", icon: "⬛" },
    { label: "Inbox", key: "inbox", icon: "📥" },
    { label: "Governance", key: "governance", icon: "🛡️" },
    { label: "History", key: "history", icon: "📋" },
    { label: "Settings", key: "settings", icon: "⚙️" },
  ];

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search pages, actions, agents…"
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        {/* Results or quick links */}
        <div className="p-2 max-h-80 overflow-y-auto">
          {q.trim() === "" ? (
            <>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-2 py-1.5">
                Quick navigation
              </p>
              {QUICK_LINKS.map(link => (
                <button
                  key={link.key}
                  onClick={() => { nav(link.key); onClose(); }}
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                >
                  <span className="text-base">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </button>
              ))}
            </>
          ) : results.length > 0 ? (
            <>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-2 py-1.5">
                Results
              </p>
              {results.map(r => (
                <button
                  key={r.seq}
                  onClick={() => { nav("history"); onClose(); }}
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                >
                  <span className="font-medium truncate">{r.action}</span>
                  <span className="ml-auto text-muted-foreground text-xs shrink-0">{r.agent}</span>
                </button>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
              No results for &ldquo;{q}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sidebar
// ============================================================
function AegisSidebar({ route, onOpenWizard, dark, toggleTheme }: {
  route: RouteKey;
  onOpenWizard: () => void;
  dark: boolean;
  toggleTheme: () => void;
}) {
  const { approvals } = useStore();
  const groups: { label: string; items: NavItem[] }[] = [
    { label: "Today", items: NAV.filter((n) => n.group === "today") },
    { label: "Configure", items: NAV.filter((n) => n.group === "setup") },
  ];

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="ad-side *:data-[slot=sidebar-inner]:bg-sidebar">
      <SidebarHeader className="h-(--app-header-height,3rem) flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
        <a href="#/app/dashboard" className="flex items-center gap-2 px-1.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:mx-auto">
          <img
            src={dark ? "/logo_bgremoved_inverted.png" : "/logo_bgremoved.png"}
            alt="AgentTag"
            className="h-5 w-auto"
            style={{ filter: dark ? "grayscale(1) brightness(10)" : "grayscale(1) brightness(0)" }}
          />
          <span className="font-semibold tracking-tight group-data-[collapsible=icon]:hidden">AgentTag</span>
        </a>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="gap-2 group-data-[collapsible=icon]:hidden">
          <Button onClick={onOpenWizard} size="default" className="w-full justify-center gap-1.5 rounded-lg font-semibold ad-connect-btn transition-transform active:scale-[0.96]">
            <Plus className="size-4" /> Connect Agent
          </Button>
        </SidebarGroup>

        {groups.map((g, idx) => (
          <div key={g.label}>
            {idx > 0 && <SidebarSeparator className="my-2 opacity-30 mx-4" />}
            <SidebarGroup>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{g.label}</SidebarGroupLabel>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={route === item.key} tooltip={item.label} className="ad-nav-item">
                      <a href={`#/app/${item.key}`}>
                        {item.icon}
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                    {item.key === "inbox" && approvals.length > 0 && (
                      <SidebarMenuBadge className="bg-destructive text-white">{approvals.length}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-2 px-3 pb-3 group-data-[collapsible=icon]:px-1.5">
        <Button variant="outline" size="sm" className="w-full justify-center gap-2 ad-theme-toggle rounded-lg font-medium shadow-xs transition-transform active:scale-[0.96] group-data-[collapsible=icon]:hidden" onClick={toggleTheme}>
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {dark ? "Light theme" : "Dark theme"}
        </Button>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={route === "support"} tooltip="Support" className="ad-nav-item">
              <a href="#/app/support">
                <LifeBuoy />
                <span>Support</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="flex items-center gap-2.5 rounded-lg ad-agent-card p-2.5 shadow-xs group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:justify-center">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
            <Cpu className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="text-xs font-semibold leading-tight">Aegis Agent</div>
            <div className="truncate font-mono text-[10px] text-muted-foreground">did:key:z6MkvS…W8X23b</div>
          </div>
          <ChevronsUpDown className="size-3.5 text-zinc-500 shrink-0 group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

// ============================================================
// Header
// ============================================================
function AegisHeader({
  route, nav, dark, toggleTheme, onOpenSearch,
}: {
  route: RouteKey;
  nav: (k: RouteKey) => void;
  dark: boolean;
  toggleTheme: () => void;
  onOpenSearch: () => void;
}) {
  const { approvals } = useStore();

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenSearch]);

  // Suppress unused warning for dark/toggleTheme (used via props)
  void dark;
  void toggleTheme;

  return (
    <header className="sticky top-0 z-30 flex h-(--app-header-height,3rem) w-full shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-4 md:px-6 relative">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Breadcrumb>
          <BreadcrumbList className="flex items-center gap-1 text-xs text-muted-foreground flex-row">
            <BreadcrumbItem>
              <span className="text-muted-foreground/60">Aegis</span>
            </BreadcrumbItem>
            <span className="text-muted-foreground/30 text-[10px] select-none">/</span>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground">{ROUTE_LABEL[route]}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Centered Command Bar Trigger */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
        <button
          onClick={onOpenSearch}
          className="flex h-8 w-64 items-center justify-between rounded-lg border border-zinc-200/40 bg-zinc-50/50 px-3 text-xs text-muted-foreground hover:bg-zinc-100/50 dark:border-zinc-800/40 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Search size={13} />
            <span>Search or ask agent...</span>
          </span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-zinc-200 bg-muted px-1.5 font-mono text-[9px] font-medium opacity-100 dark:border-zinc-800">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Help"
          onClick={() => nav("help")}
        >
          <HelpCircle />
        </Button>

        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Notifications"
          className="relative"
          onClick={() => nav("notifications")}
        >
          <Bell />
          {approvals.length > 0 && (
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">
              {approvals.length}
            </span>
          )}
        </Button>

        <Separator className="h-4 data-[orientation=vertical]:self-center" orientation="vertical" />

        <button
          onClick={() => nav("profile")}
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 transition-transform hover:scale-105 active:scale-95"
        >
          <Avatar className="size-8">
            <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80" alt="operator" />
            <AvatarFallback>OP</AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}

// ============================================================
// Shell
// ============================================================
function Shell() {
  const [route, nav] = useHashRoute();
  const [dark, toggleTheme] = useTheme();
  const [wizardOpen, setWizardOpen] = useState(() => localStorage.getItem("aeg-dash-wizard-done") !== "1");
  const [searchOpen, setSearchOpen] = useState(false);
  const { ledger } = useStore();

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
      <SidebarProvider className={cn("flex-1", "[--app-wrapper-max-width:80rem]", "[--app-header-height:3rem]")}>
        <AegisSidebar route={route} onOpenWizard={() => setWizardOpen(true)} dark={dark} toggleTheme={toggleTheme} />
        <SidebarInset className="min-h-0 bg-muted dark:bg-background">
          <AegisHeader
            route={route}
            nav={nav}
            dark={dark}
            toggleTheme={toggleTheme}
            onOpenSearch={() => setSearchOpen(true)}
          />
          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={route}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="flex h-full min-h-0 flex-1 flex-col"
              >
                {route === "governance" && <GovernancePage />}
                {route === "dashboard" && <OverviewPage onNav={nav} />}
                {route === "inbox" && <InboxPage onNav={nav} />}
                {route === "history" && <HistoryPage />}
                {route === "providers" && <ProvidersPage />}
                {route === "devices" && <DevicesPage />}
                {route === "settings" && <SettingsPage onReopenWizard={() => setWizardOpen(true)} />}
                {route === "support" && <SupportPage />}
                {route === "notifications" && <NotificationsPage onNav={nav} />}
                {route === "profile" && <ProfilePage />}
                {route === "help" && <HelpPage />}
              </motion.div>
            </AnimatePresence>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <AnimatePresence>
        {wizardOpen && <Wizard onClose={finishWizard} onFinish={finishWizard} onNav={nav} />}
      </AnimatePresence>
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        nav={nav}
        ledger={ledger}
      />
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
