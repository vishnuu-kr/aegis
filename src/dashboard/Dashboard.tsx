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
import { GovernancePage, OverviewPage, InboxPage, HistoryPage, ProvidersPage, DevicesPage, SettingsPage, SettingsOverview, SettingsAccountPage, SettingsWorkspacePage, SettingsAuditPage, SettingsNotificationsPage, SettingsIntegrationsPage, NotificationsPage, ProfilePage, SupportPage, HelpPage } from "./pages";
import { Wizard } from "./Wizard";
import { CommandPalette, useCommandKShortcut } from "./CommandPalette";
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
import { getStored, setStored, removeStored } from "@/lib/storage";

export type RouteKey =
  | "dashboard" | "governance" | "inbox" | "history" | "providers" | "devices" | "settings" | "support"
  | "notifications" | "profile" | "help";

export type SettingsSubpath =
  | "overview"
  | "security"
  | "account"
  | "workspace"
  | "notifications"
  | "integrations"
  | "audit";

const SETTINGS_SUBPATHS: SettingsSubpath[] = [
  "overview", "security", "account", "workspace", "notifications", "integrations", "audit",
];

/** Returns the settings sub-path (or null) for the current hash. */
export function parseSettingsSubpath(): SettingsSubpath | null {
  const h = window.location.hash.replace(/^#\/?app\/?/, "").replace(/^#\/?/, "");
  const parts = h.split(/[/?]/);
  if (parts[0] !== "settings") return null;
  const sub = parts[1] || "overview";
  return (SETTINGS_SUBPATHS as readonly string[]).includes(sub) ? (sub as SettingsSubpath) : "overview";
}

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
    setStored("aeg-theme", next ? "dark" : "light");
  };
  return [dark, toggle];
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
        <Button variant="outline" size="sm" className="ad-topbar-btn ad-theme-toggle w-full justify-center gap-2 rounded-lg font-medium shadow-xs group-data-[collapsible=icon]:hidden" onClick={toggleTheme}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={dark ? "sun" : "moon"}
              initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </motion.span>
          </AnimatePresence>
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

  // Cmd+K / Ctrl+K keyboard shortcut (centralized via the palette hook)
  useCommandKShortcut(onOpenSearch);

  // Suppress unused warning for dark/toggleTheme (used via props)
  void dark;
  void toggleTheme;

  return (
    <header className="sticky top-0 z-30 flex h-(--app-header-height,3rem) w-full shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-4 md:px-6 relative">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="ad-topbar-btn" />
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
          aria-label="Open command palette"
          aria-keyshortcuts="Meta+K Control+K"
          className="ad-topbar-btn is-cmdk flex h-8 w-64 items-center justify-between rounded-lg px-3 text-xs transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Search size={13} />
            <span>Search actions, pages, agents…</span>
          </span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded px-1.5">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Help"
          className="ad-topbar-btn"
          onClick={() => nav("help")}
        >
          <HelpCircle />
        </Button>

        <Button
          size="icon-sm"
          variant="outline"
          aria-label={`Notifications${approvals.length > 0 ? `, ${approvals.length} unread` : ""}`}
          className="ad-topbar-btn relative"
          onClick={() => nav("notifications")}
        >
          <span className={`inline-flex ${approvals.length > 0 ? "ad-bell-shake" : ""}`} aria-hidden="true">
            <Bell />
          </span>
          {approvals.length > 0 && (
            <span
              className="ad-bell-badge absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center"
              aria-hidden="true"
            >
              {approvals.length}
            </span>
          )}
        </Button>

        <Separator className="h-4 data-[orientation=vertical]:self-center" orientation="vertical" />

        <button
          onClick={() => nav("profile")}
          aria-label="Open profile"
          className="ad-topbar-btn rounded-full focus:outline-none focus-visible:[box-shadow:var(--shadow-focus)]"
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
  const [wizardOpen, setWizardOpen] = useState(() => getStored("aeg-dash-wizard-done") !== "1");
  const [searchOpen, setSearchOpen] = useState(false);
  const { ledger, agents, approvals } = useStore();

  const finishWizard = () => {
    setStored("aeg-dash-wizard-done", "1");
    removeStored("aeg-dash-wizard-step");
    setWizardOpen(false);
  };

  // Global ⌘K / Ctrl+K shortcut opens the palette from anywhere on the dashboard.
  useCommandKShortcut(() => setSearchOpen(true));

  // Keep the URL canonical when landing on bare #/app.
  useEffect(() => {
    if (!/\/app\//.test(window.location.hash)) window.location.hash = `/app/${route}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="aeg-dash">
      <a className="skip-link" href="#main-content">Skip to main content</a>
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
          <main id="main-content" className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <motion.div
              key={route}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.08, ease: "easeOut" }}
              className="flex h-full min-h-0 flex-1 flex-col"
            >
              {route === "governance" && <GovernancePage />}
              {route === "dashboard" && <OverviewPage onNav={nav} />}
              {route === "inbox" && <InboxPage onNav={nav} />}
              {route === "history" && <HistoryPage />}
              {route === "providers" && <ProvidersPage />}
              {route === "devices" && <DevicesPage />}
              {route === "settings" && (() => {
                const sub = parseSettingsSubpath();
                if (sub === null || sub === "overview") return <SettingsOverview />;
                if (sub === "security") return <SettingsPage onReopenWizard={() => setWizardOpen(true)} />;
                if (sub === "account") return <SettingsAccountPage />;
                if (sub === "workspace") return <SettingsWorkspacePage />;
                if (sub === "audit") return <SettingsAuditPage />;
                if (sub === "notifications") return <SettingsNotificationsPage />;
                if (sub === "integrations") return <SettingsIntegrationsPage />;
                return <SettingsOverview />;
              })()}
              {route === "support" && <SupportPage />}
              {route === "notifications" && <NotificationsPage onNav={nav} />}
              {route === "profile" && <ProfilePage />}
              {route === "help" && (
                <HelpPage onNav={nav} onOpenPalette={() => setSearchOpen(true)} />
              )}
            </motion.div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <AnimatePresence>
        {wizardOpen && <Wizard onClose={finishWizard} onFinish={finishWizard} onNav={nav} />}
      </AnimatePresence>
      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        nav={nav}
        ledger={ledger}
        agents={agents}
        approvals={approvals}
        dark={dark}
        toggleTheme={toggleTheme}
        onOpenWizard={() => setWizardOpen(true)}
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
