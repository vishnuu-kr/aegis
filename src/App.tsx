import RotatingWord from "./components/RotatingWord"
import { useState, useEffect, useRef } from "react"
import { MotionConfig, motion, AnimatePresence } from "framer-motion"
import WorldMap from "./components/WorldMap"
import Lenis from "lenis"
import { StoreProvider } from "./dashboard/data"
import { OverviewPage, GovernancePage, InboxPage } from "./dashboard/pages"
import { Wizard } from "./dashboard/Wizard"

// ── Motion system ───────────────────────────────────────────────────────────
// One reveal "hand" for the whole page so sections resolve cohesively instead
// of with 60 independent ad-hoc timings.
// const EASE = [0.22, 1, 0.36, 1] as const;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ── Live MCP terminal ────────────────────────────────────────────────────────
// Types the install command, then streams the success lines, then loops.
const MCP_CMD = "agenttag mcp add --client claude";
const MCP_OUT: (React.ReactNode | null)[] = [
  <><span className="ok">✓</span> passport minted&nbsp;&nbsp;<span className="dim">did:key:z6Mk…</span></>,
  <><span className="ok">✓</span> mandate signed&nbsp;&nbsp;<span className="dim">starter · $50/mo</span></>,
  <><span className="ok">✓</span> server connected</>,
  null, // spacer
  <># claude_desktop_config.json</>,
  <><span className="dim">{"{"}</span> <span className="br">"agenttag"</span>: <span className="dim">{"{"}</span> <span className="br">"command"</span>: <span className="grn">"agenttag"</span> <span className="dim">{"}"} {"}"}</span></>,
];

function MCPConsole() {
  const reduce = prefersReducedMotion();
  const [typed, setTyped] = useState(reduce ? MCP_CMD.length : 0);
  const [shown, setShown] = useState(reduce ? MCP_OUT.length : 0);
  const [typing, setTyping] = useState(!reduce);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (reduce) return;
    const at = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
    const clearAll = () => { timers.current.forEach((id) => clearTimeout(id)); timers.current = []; };

    const run = () => {
      clearAll();
      setTyped(0); setShown(0); setTyping(true);
      let delay = 650;
      for (let i = 1; i <= MCP_CMD.length; i++) {
        const n = i;
        at(() => setTyped(n), delay);
        delay += 42 + (MCP_CMD[i - 1] === " " ? 55 : 0);
      }
      at(() => setTyping(false), delay + 250);
      delay += 650;
      for (let i = 1; i <= MCP_OUT.length; i++) {
        const n = i;
        at(() => setShown(n), delay);
        delay += 430;
      }
      at(run, delay + 2800); // hold, then loop
    };
    run();
    return clearAll;
  }, [reduce]);

  const allShown = shown >= MCP_OUT.length;
  return (
    <div className="mcp-console z">
      <div className="mcp-cl">
        <span className="pmt">$</span> {MCP_CMD.slice(0, typed)}
        {typing && <span className="term-caret">▋</span>}
      </div>
      {MCP_OUT.map((line, i) =>
        i >= shown ? null : line === null ? (
          <div className="mcp-spacer" key={i}></div>
        ) : (
          <div className={"mcp-cl term-line font-tabular" + (i === 4 ? " cmt" : "")} key={i}>{line}</div>
        )
      )}
      {!typing && allShown && (
        <div className="mcp-cl"><span className="pmt">$</span> <span className="term-caret">▋</span></div>
      )}
    </div>
  );
}

// Clean, monochrome icons for dynamically added tools in the integrations section
const toolIcons: Record<string, React.ReactNode> = {
  Slack: (
    <svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="15"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
  ),
  Notion: (
    <svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
  ),
  "AWS Lambda": (
    <svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="15"><rect height="18" rx="2" ry="2" width="18" x="3" y="3"></rect><line x1="9" x2="15" y1="9" y2="15"></line><line x1="15" x2="9" y1="9" y2="15"></line></svg>
  ),
  Linear: (
    <svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="15"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
  )
};


function App() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const isCtaHoveredRef = useRef(false);

  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 3) {
      setVideoLoaded(true);
    }
    const timer = setTimeout(() => {
      setVideoLoaded(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showcaseTab, setShowcaseTab] = useState<'overview' | 'governance' | 'inbox' | 'wizard'>('overview');
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleDropdownEnter = () => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
      dropdownTimerRef.current = null;
    }
    setDropdownOpen(true);
  };
  
  const handleDropdownLeave = () => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
    }
    dropdownTimerRef.current = setTimeout(() => {
      setDropdownOpen(false);
      dropdownTimerRef.current = null;
    }, 150);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);



  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("aeg-theme") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem("aeg-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Mouse position tracking for premium CTA buttons
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const btn = e.currentTarget as HTMLElement;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      btn.style.setProperty('--mouse-x', `${x}px`);
      btn.style.setProperty('--mouse-y', `${y}px`);
    };

    const updateButtons = () => {
      const buttons = document.querySelectorAll<HTMLElement>('.btn, .btn-cta-primary, .btn-capsule-cta, .btn-cta-new');
      buttons.forEach(btn => {
        btn.removeEventListener('mousemove', handleMouseMove);
        btn.removeEventListener('mouseenter', handleMouseMove);
        btn.addEventListener('mousemove', handleMouseMove);
        btn.addEventListener('mouseenter', handleMouseMove);
      });
    };

    updateButtons();

    const timer = setTimeout(updateButtons, 500);

    return () => {
      clearTimeout(timer);
      const buttons = document.querySelectorAll<HTMLElement>('.btn, .btn-cta-primary, .btn-capsule-cta, .btn-cta-new');
      buttons.forEach(btn => {
        btn.removeEventListener('mousemove', handleMouseMove);
        btn.removeEventListener('mouseenter', handleMouseMove);
      });
    };
  }, []);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 1.5,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Coordinate with native anchors for smooth scrolling with offset
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        // Let route links (#/app/…) fall through to the browser/hash router.
        if (href && href.startsWith('#') && !href.startsWith('#/')) {
          e.preventDefault();
          const targetEl = document.querySelector(href);
          if (targetEl) {
            // Give 74px offset for sticky header
            lenis.scrollTo(targetEl as HTMLElement, { offset: -74 });
          } else if (href === '#top') {
            lenis.scrollTo(0);
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  // 1. Card interactive mouse listeners (3D tilt & Spotlight border glow - decoupled)
  useEffect(() => {
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduce) return;

    const onMouseMove = (e: MouseEvent) => {
      // Handle spotlight coordinates
      const spotlightTarget = (e.target as HTMLElement).closest('.card-spotlight') as HTMLElement;
      if (spotlightTarget) {
        const rect = spotlightTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        spotlightTarget.style.setProperty('--mx', `${x}px`);
        spotlightTarget.style.setProperty('--my', `${y}px`);
      }

      // Handle 3D tilt
      const tiltTarget = (e.target as HTMLElement).closest('.card-tilt') as HTMLElement;
      if (tiltTarget) {
        const rect = tiltTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate teeny-tiny rotation X and Y (max 2.5 degrees)
        const rx = ((y / rect.height - 0.5) * -5).toFixed(2);
        const ry = ((x / rect.width - 0.5) * 5).toFixed(2);
        
        tiltTarget.style.setProperty('--rx', `${rx}deg`);
        tiltTarget.style.setProperty('--ry', `${ry}deg`);
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const tiltTarget = (e.target as HTMLElement).closest('.card-tilt') as HTMLElement;
      if (tiltTarget) {
        const related = e.relatedTarget as HTMLElement;
        if (!related || !tiltTarget.contains(related)) {
          tiltTarget.style.setProperty('--rx', '0deg');
          tiltTarget.style.setProperty('--ry', '0deg');
        }
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseout', onMouseOut);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseout', onMouseOut);
    };
  }, []);

  // 2. Scroll-driven 3D Showcase Unfolding
  useEffect(() => {
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduce) return;

    const handleScroll = () => {
      if (!showcaseRef.current) return;
      const rect = showcaseRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      const startScroll = viewportHeight;
      const endScroll = 220;
      
      const progress = Math.max(0, Math.min(1, (startScroll - rect.top) / (startScroll - endScroll)));
      
      const rx = (8 * (1 - progress)).toFixed(2);
      const ty = (20 * (1 - progress)).toFixed(2);
      const scale = (0.97 + 0.03 * progress).toFixed(3);
      
      showcaseRef.current.style.setProperty('--showcase-rx', `${rx}deg`);
      showcaseRef.current.style.setProperty('--showcase-ty', `${ty}px`);
      showcaseRef.current.style.setProperty('--showcase-scale', scale);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 3. Magnetic CTA gravity
  useEffect(() => {
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduce) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!ctaRef.current) return;
      
      const rect = ctaRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const threshold = 90;
      if (distance < threshold) {
        const power = (threshold - distance) / threshold;
        const tx = dx * 0.12 * power;
        const ty = dy * 0.12 * power;
        
        const isHovered = isCtaHoveredRef.current;
        ctaRef.current.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) translateY(${isHovered ? -2 : 0}px) scale(${isHovered ? 1.02 : 1})`;
      } else {
        const isHovered = isCtaHoveredRef.current;
        ctaRef.current.style.transform = `translate(0px, 0px) translateY(${isHovered ? -2 : 0}px) scale(${isHovered ? 1.02 : 1})`;
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // State & simulation data
  const scenarios = [
    { req: "pay $5.00 → vercel · saas", v: "ALLOW" },
    { req: "deploy thing.agents.host", v: "NOTICE" },
    { req: "pay $840 → acme data · new merchant", v: "STEP-UP" },
    { req: "transfer ← operator's bank", v: "DENY" },
  ];

  const ledgerPool = [
    { ev: "policy", act: "pay $5.00 → vercel · saas", v: "ALLOW" },
    { ev: "action", act: "deploy thing.agents.host", v: "NOTICE" },
    { ev: "cred_use", act: "vault → github_agent", v: "ALLOW" },
    { ev: "policy", act: "browse linear.app · signup", v: "ALLOW" },
    { ev: "comms", act: "await_verification · inbox", v: "OK" },
    { ev: "policy", act: "pay $840 → acme data · new", v: "STEP-UP" },
    { ev: "approval", act: "operator signed envelope", v: "✓" },
    { ev: "policy", act: "transfer ← operator bank", v: "DENY" },
  ];

  const genHash = () => {
    return "0x" + Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0").slice(0, 6) + "…";
  };

  const colorFor = (v: string) => {
    const colors: Record<string, string> = { 
      ALLOW: "var(--ok)", 
      NOTICE: "var(--info)", 
      "STEP-UP": "var(--warn)", 
      DENY: "var(--bad)", 
      OK: "var(--ok)", 
      "✓": "var(--ok)", 
      "-": "var(--line)" 
    };
    return colors[v] || "var(--faint)";
  };

  const [pIdx, setPIdx] = useState(0);
  const seqRef = useRef(1310);
  const ledKeyRef = useRef(0);
  const [ledger, setLedger] = useState(() =>
    ledgerPool.slice(0, 7).map((e, i) => ({ ...e, seq: 1304 + i, hash: genHash(), key: i }))
  );
  const [count, setCount] = useState(1311);

  // ---- Interactive demo controls ----
  // Approval card (STEP-UP → APPROVED / DENIED, reversible)
  const [approval, setApproval] = useState<"pending" | "approved" | "denied">("pending");

  // "Connect new tool" — append from a pool with a connecting→connected flip
  const newToolPool = [
    { name: "Slack", desc: "Scoped channel posts" },
  ];
  const [extraTools, setExtraTools] = useState<{ name: string; desc: string; status: "connecting" | "connected" }[]>([]);
  const connectTool = () => {
    if (extraTools.length >= newToolPool.length) return;
    const idx = extraTools.length;
    const next = newToolPool[idx];
    setExtraTools((prev) => [...prev, { ...next, status: "connecting" }]);
    setTimeout(() => {
      setExtraTools((cur) => cur.map((t, i) => (i === idx ? { ...t, status: "connected" } : t)));
    }, 900);
  };

  // Live mandate search filter
  const [mandateQuery, setMandateQuery] = useState("");
  const mandates = [
    { name: "saas-spend-limit.json" },
    { name: "mcp-tools-allowlist.json" },
  ];
  const filteredMandates = mandates.filter((m) => m.name.toLowerCase().includes(mandateQuery.toLowerCase()));
  // The live "eval" row matches on the literal "eval" label or the current request text
  const evalRowVisible = "eval".includes(mandateQuery.toLowerCase()) || scenarios[pIdx].req.toLowerCase().includes(mandateQuery.toLowerCase());



  // Derived values
  const policyReq = scenarios[pIdx].req;
  const policyVerdict = scenarios[pIdx].v;
  const policyColor = colorFor(policyVerdict);
  const ledgerRows = ledger.map((r) => ({ ...r, color: colorFor(r.v) }));
  const ledgerCount = count.toLocaleString();

  // Handle Form Submit
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector('input[type="email"]') as HTMLInputElement;
    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (!input || !input.value || !input.value.includes('@')) {
      const wrapper = input.closest('.footer-newsletter-input-wrapper') as HTMLElement || input;
      if (wrapper) {
        wrapper.style.borderColor = 'var(--bad)';
        wrapper.style.boxShadow = '0 0 0 3px var(--line)';
        setTimeout(() => { wrapper.style.borderColor = ''; wrapper.style.boxShadow = ''; }, 1500);
      }
      return;
    }
    if (btn) {
      const oldText = btn.innerHTML;
      btn.style.background = 'var(--ok)';
      btn.innerText = 'Sent!';
      input.value = '';
      setTimeout(() => { btn.style.background = ''; btn.innerHTML = oldText; }, 2000);
    }
  };

  // Scroll-reveal: section content rises gently into view. Tuned to feel
  // premium, not janky — it triggers *before* an element enters so nothing
  // fades in late, reveals anything already on the first screen immediately,
  // and has a fail-safe so content can never get stuck invisible.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("section.aeg-section"));
    const targets: HTMLElement[] = [];
    sections.forEach((sec) => {
      const kids = sec.querySelectorAll<HTMLElement>(
        ":scope > .eyebrow, :scope > h2, :scope > p, :scope > .card, :scope > .panel-dark, :scope > [class*='grid'], :scope > [class*='flows'], :scope > [class*='cmp'], :scope > .policy-grid, :scope > .faq-list, :scope > .gov-flow, :scope > .gov-pillars"
      );
      kids.forEach((el, i) => {
        if (el.classList.contains("reveal")) return; // hero handles its own
        el.classList.add("sr");
        el.style.setProperty("--sr-i", String(Math.min(i, 5)));
        targets.push(el);
      });
    });
    if (!targets.length) return;
    const reveal = (el: Element) => el.classList.add("sr-in");

    // Reveal whatever is already within (or just below) the first screen so the
    // initial paint is never a wall of blank space.
    requestAnimationFrame(() => {
      const vh = window.innerHeight;
      targets.forEach((el) => {
        if (el.getBoundingClientRect().top < vh * 1.05) reveal(el);
      });
    });

    if (!("IntersectionObserver" in window)) {
      targets.forEach(reveal);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
        });
      },
      // Positive bottom margin => fire ~16% before the element scrolls in.
      { threshold: 0, rootMargin: "0px 0px 16% 0px" }
    );
    targets.forEach((t) => io.observe(t));

    // Crash guard: if the observer never fires for some target, reveal it.
    const failsafe = window.setTimeout(() => targets.forEach(reveal), 5000);

    return () => { io.disconnect(); clearTimeout(failsafe); };
  }, []);

  // Run simulation loops
  useEffect(() => {
    // Reduced-motion: leave the panels in their initial static state.
    if (prefersReducedMotion()) return;

    // Policy scenario cycler
    const polInterval = setInterval(() => {
      setPIdx((prev) => (prev + 1) % scenarios.length);
    }, 2400);

    // Ledger log entry pusher
    ledKeyRef.current = 6;
    const ledInterval = setInterval(() => {
      const nextSeq = seqRef.current + 1;
      seqRef.current = nextSeq;
      const uniqueKey = ++ledKeyRef.current;
      setCount((prevCount) => prevCount + 1);
      setLedger((prevLedger) => {
        const e = ledgerPool[nextSeq % ledgerPool.length];
        const newRow = { ...e, seq: nextSeq, hash: genHash(), key: uniqueKey };
        return [...prevLedger, newRow].slice(-7);
      });
    }, 1700);

    return () => {
      clearInterval(polInterval);
      clearInterval(ledInterval);
    };
  }, []);

  // Run Hero Canvas dot animation
  useEffect(() => {
    const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const header = document.getElementById('top');
    const container = (canvas.closest('.hero-bg-container') || header) as HTMLElement | null;
    if (!header || !ctx || !container) return;

    // Cache the color once to prevent layout recalculation
    const crimsonColor = getComputedStyle(canvas).getPropertyValue('--crimson').trim() || '#000000';

    let width = 0;
    let height = 0;

    const spacing = 13;
    const bSize = 0.3;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = crimsonColor;
      ctx.globalAlpha = 0.055;
      ctx.beginPath();
      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          ctx.rect(x - bSize, y - bSize, bSize * 2, bSize * 2);
        }
      }
      ctx.fill();
    };

    const handleResize = () => {
      const parent = container || header;
      width = parent.offsetWidth;
      height = parent.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      render();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
<div className="aeg-page">
<a className="skip-link" href="#main">Skip to main content</a>
{/* ==================== NAV (page-level sticky, floats over hero) ==================== */}
<div className={`aeg-nav-container ${isScrolled ? 'is-scrolled' : ''}`}>
<nav className={`aeg-nav ${isScrolled ? 'is-scrolled' : ''}`} aria-label="Main navigation">
  <div style={{height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: isScrolled ? "0 6px 0 18px" : "0 40px", transition: "padding 0.4s var(--ease)", maxWidth: "100%"}}>
    <div style={{display: "flex", alignItems: "center", gap: "34px"}}>
      <a href="#top" style={{display: "flex", alignItems: "center", gap: "10px", textDecoration: "none"}}>
        <img 
          src={theme === 'dark' ? "/logo_bgremoved_inverted.png" : "/logo_bgremoved.png"} 
          alt="AgentTag Logo" 
          height="24" 
          style={{ height: "24px", width: "auto" }} 
          className="brand-logo-img" 
        />
        <span className="brand-logo-text">AgentTag</span>
      </a>
      <div className="hide-sm" style={{display: "flex", alignItems: "center", gap: "2px"}}>
        {/* Platform Dropdown */}
        <div className={`nav-item ${dropdownOpen ? 'is-active' : ''}`} onMouseEnter={handleDropdownEnter} onMouseLeave={handleDropdownLeave}>
          <a className="nav-link" href="#how" aria-haspopup="true" aria-expanded={dropdownOpen} role="button">
            Platform
            <svg className="chevron-icon" fill="none" height="10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" width="10"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </a>
          <div className={`t-dropdown ${dropdownOpen ? 'is-open' : ''}`} data-origin="top-center" role="menu" aria-label="Platform navigation">
            <div className="dropdown-grid">
              <a className="dropdown-item-card" href="#primitives" role="menuitem">
                <div className="dropdown-item-icon-tile dropdown-icon-purple">
                  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                </div>
                <span className="dropdown-item-title">Platform</span>
                <span className="dropdown-item-desc">One control plane — policy engine, identity, and audit ledger — governing every agent.</span>
              </a>
              <a className="dropdown-item-card" href="#surface" role="menuitem">
                <div className="dropdown-item-icon-tile dropdown-icon-blue">
                  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" x2="20" y1="19" y2="19"></line></svg>
                </div>
                <span className="dropdown-item-title">MCP Surface</span>
                <span className="dropdown-item-desc">Standardized tools connected to Claude, ChatGPT, or custom client libraries.</span>
              </a>
              <a className="dropdown-item-card" href="#policy" role="menuitem">
                <div className="dropdown-item-icon-tile dropdown-icon-green">
                  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 11 2 2 4-4"></path></svg>
                </div>
                <span className="dropdown-item-title">Policy Engine</span>
                <span className="dropdown-item-desc">Cryptographically signed mandates that run real-time step-up human checks.</span>
              </a>
              <a className="dropdown-item-card" href="#ledger" role="menuitem">
                <div className="dropdown-item-icon-tile dropdown-icon-orange">
                  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </div>
                <span className="dropdown-item-title">Audit Ledger</span>
                <span className="dropdown-item-desc">Tamper-evident, hash-chained logs that record every single agent invocation.</span>
              </a>
            </div>
          </div>
        </div>
        <a className="nav-link" href="#pricing">Pricing</a>
        <a className="nav-link" href="#surface">Docs</a>
        <a className="nav-link" href="#/support">Support</a>
      </div>
    </div>
    
    <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
      <button aria-label="Toggle dark mode" className="theme-toggle" id="themeToggle" title="Toggle dark mode" type="button" onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={theme}
            initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {theme === 'dark' ? (
              <svg className="t-moon" fill="none" height="16" viewBox="0 0 24 24" width="16"><path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6"></path></svg>
            ) : (
              <svg className="t-sun" fill="none" height="16" viewBox="0 0 24 24" width="16"><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6"></circle><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6"></path></svg>
            )}
          </motion.span>
        </AnimatePresence>
      </button>
      <button aria-expanded={mobileMenuOpen} aria-label="Toggle menu" className="mobile-menu-toggle" id="mobileMenuToggle" type="button" onClick={() => setMobileMenuOpen(prev => !prev)}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={mobileMenuOpen ? "close" : "menu"}
            initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {mobileMenuOpen ? (
              <svg className="icon-close" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>
            ) : (
              <svg className="icon-menu" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><line x1="3" x2="21" y1="12" y2="12"></line><line x1="3" x2="21" y1="6" y2="6"></line><line x1="3" x2="21" y1="18" y2="18"></line></svg>
            )}
          </motion.span>
        </AnimatePresence>
      </button>
      <a className="btn-capsule-cta" href="#cta">Request access</a>
    </div>
  </div>

  <div className={`mobile-menu glass ${mobileMenuOpen ? 'is-open' : ''}`} id="mobileMenu" role="dialog" aria-label="Mobile navigation" aria-modal="false">
    <div style={{display: "flex", flexDirection: "column", gap: "8px", padding: "18px 16px"}}>
      <a className="mobile-nav-link" href="#primitives" onClick={() => setMobileMenuOpen(false)}>Platform</a>
      <a className="mobile-nav-link" href="#surface" onClick={() => setMobileMenuOpen(false)}>MCP surface</a>
      <a className="mobile-nav-link" href="#policy" onClick={() => setMobileMenuOpen(false)}>Policy</a>
      <a className="mobile-nav-link" href="#ledger" onClick={() => setMobileMenuOpen(false)}>Audit</a>
      <a className="mobile-nav-link" href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
      <a className="mobile-nav-link" href="#surface" style={{opacity: ".7"}} onClick={() => setMobileMenuOpen(false)}>Docs</a>
      <a className="mobile-nav-link" href="#/support" onClick={() => setMobileMenuOpen(false)}>Support</a>
      <a className="btn btn-ink" href="#cta" style={{marginTop: "10px", justifyContent: "center", width: "100%"}} onClick={() => setMobileMenuOpen(false)}>Request access</a>
    </div>
  </div>

</nav>
</div>
<div id="main">
{/* ==================== HERO BOX ==================== */}
<div className="hero-bg-container">
  <video
    ref={videoRef}
    className={`hero-bg-video ${videoLoaded ? 'is-loaded' : ''}`}
    src="/bg_vid.mp4"
    autoPlay
    loop
    muted
    playsInline
    onCanPlayThrough={() => setVideoLoaded(true)}
    onPlay={() => setVideoLoaded(true)}
    onLoadedData={() => setVideoLoaded(true)}
  />
{/* ==================== HERO ==================== */}
  {/* Organic SVG liquid mesh gradient background */}
  <div className="hero-svg-bg">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" width="100%" height="100%" preserveAspectRatio="none" className="hero-svg-element">
      <defs>
        {/* Three blur levels: Deep ambient, Medium blend, and Soft liquid wave */}
        <filter id="liquid-blur-deep" filterUnits="userSpaceOnUse" x="-300" y="-300" width="2040" height="1500">
          <feGaussianBlur stdDeviation="150" />
        </filter>
        <filter id="liquid-blur-medium" filterUnits="userSpaceOnUse" x="-200" y="-200" width="1840" height="1300">
          <feGaussianBlur stdDeviation="100" />
        </filter>
        <filter id="liquid-blur-soft" filterUnits="userSpaceOnUse" x="-100" y="-100" width="1640" height="1100">
          <feGaussianBlur stdDeviation="60" />
        </filter>

        {/* Ambient premium monochrome glow definitions */}
        <radialGradient id="glow-amber-light" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d1d5db" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#e5e7eb" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glow-amber-dark" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3f3f46" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#27272a" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Wave Gradients */}
        <linearGradient id="wave-grad-light" x1="0%" y1="70%" x2="100%" y2="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="wave-grad-dark" x1="0%" y1="70%" x2="100%" y2="30%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="30%" stopColor="#27272a" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#3f3f46" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#52525b" stopOpacity="0.7" />
        </linearGradient>
        
        <linearGradient id="wave-grad-light-2" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#f3f4f6" stopOpacity="0" />
          <stop offset="40%" stopColor="#e5e7eb" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#d1d5db" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="wave-grad-dark-2" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="50%" stopColor="#27272a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#52525b" stopOpacity="0.6" />
        </linearGradient>

        {/* Base Background Gradients */}
        <linearGradient id="bg-base-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3f4f6" />
        </linearGradient>
        <linearGradient id="bg-base-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="100%" stopColor="#0c0c0e" />
        </linearGradient>
      </defs>
      
      {/* Base background fill removed to make background video visible */}
      
      {/* ================= LAYER 1: Deep Ambient Glows ================= */}
      <g filter="url(#liquid-blur-deep)">
        {/* Single faint corner wash — the only remaining ambient glow, pulled to
            the bottom-right so the headline sits on near-white. Premium = quiet. */}
        <ellipse
          className="gradient-blob-1"
          cx="1180"
          cy="780"
          rx="620"
          ry="480"
          fill={theme === 'dark' ? 'url(#glow-amber-dark)' : 'url(#glow-amber-light)'}
          opacity={theme === 'dark' ? 0.34 : 0.13}
        />

        {/* Saturated ambient blob in upper-right — cut hard (was 0.85) */}
        <circle
          className="gradient-blob-2"
          cx="1100"
          cy="300"
          r="650"
          fill={theme === 'dark' ? 'url(#wave-grad-dark-2)' : 'url(#wave-grad-light-2)'}
          opacity={theme === 'dark' ? 0.12 : 0}
        />

        {/* Soft Left Ambient Glow — removed in light, faint in dark */}
        <ellipse
          className="gradient-blob-3"
          cx="150"
          cy="450"
          rx="600"
          ry="700"
          fill={theme === 'dark' ? 'url(#wave-grad-dark)' : 'url(#wave-grad-light)'}
          opacity={theme === 'dark' ? 0.1 : 0}
        />
      </g>

      {/* ================= LAYER 2: Transition Ambient Waves ================= */}
      <g filter="url(#liquid-blur-medium)">
        {/* Right side primary wave — dark only, very faint */}
        <path
          className="gradient-blob-1"
          d="M 350 900
             C 650 720, 950 450, 1150 200
             S 1380 50, 1440 0
             L 1440 900
             Z"
          fill={theme === 'dark' ? 'url(#wave-grad-dark)' : 'url(#wave-grad-light)'}
          opacity={theme === 'dark' ? 0.2 : 0}
        />

        {/* Left side primary wave — dark only, very faint */}
        <path
          className="gradient-blob-2"
          d="M -150 0
             C 150 150, 200 450, 50 900
             L -150 900
             Z"
          fill={theme === 'dark' ? 'url(#wave-grad-dark-2)' : 'url(#wave-grad-light-2)'}
          opacity={theme === 'dark' ? 0.16 : 0}
        />
      </g>
    </svg>
  </div>


  <canvas className="hero-dots" id="hero-canvas"></canvas>
<header className="aeg-wrap" id="top" style={{paddingTop: "112px", paddingBottom: "96px", position: "relative", zIndex: "1"}}>
<div style={{display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "48px", maxWidth: "800px", margin: "0 auto", width: "100%"}}>
{/* CENTERED: copy */}
<div className="hero-copy">
<a className="pill-badge reveal" href="#cta" style={{marginBottom: "26px"}}>
<span style={{position: "relative", display: "inline-flex", width: "8px", height: "8px"}}>
<span style={{position: "absolute", inset: "0", borderRadius: "50%", background: "var(--ok)", animation: "aeg-ping 1.8s var(--ease) infinite"}}></span>
<span className="dot" style={{width: "8px", height: "8px", background: "var(--ok)", boxShadow: "0 0 8px var(--ok)"}}></span>
</span>
<span>Now in public beta <span style={{opacity: 0.55}}>— free to use</span></span>
</a>
<h1 className="display reveal d1" style={{margin: "0", fontSize: "clamp(36px, 5.2vw, 60px)", lineHeight: "1.25", letterSpacing: "-.025em", textAlign: "center", textWrap: "balance"}}>
          Give every agent <span style={{ whiteSpace: "nowrap" }}>its own <RotatingWord />.</span>
</h1>
<p className="reveal d2" style={{maxWidth: "640px", margin: "24px auto 0", fontSize: "clamp(16px, 1.5vw, 18px)", lineHeight: "1.68", color: "var(--ink-soft)", opacity: 0.82, textAlign: "center"}}>
          The control plane that gives every agent its own credentials and audit trail — governed by signed mandates you control and can revoke in one step.
        </p>
<div className="hero-row reveal d3" style={{display: "flex", gap: "16px", alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginTop: "32px"}}>
<a 
  ref={ctaRef}
  className="btn-cta-primary" 
  href="#/app/dashboard"
  onMouseEnter={() => { isCtaHoveredRef.current = true; }}
  onMouseLeave={() => {
    isCtaHoveredRef.current = false;
    if (ctaRef.current) {
      ctaRef.current.style.transform = "translate(0px, 0px) translateY(0px) scale(1)";
    }
  }}
>
            Get beta access <span style={{fontFamily: "monospace", fontWeight: "600", marginLeft: "2px"}}>&gt;<span className="btn-cta-cursor">_</span></span>
</a>
<a className="btn btn-ghost" href="#surface" style={{padding: "12.5px 28px"}}>
            Read the docs
</a>
</div>
<p className="reveal d3" style={{marginTop: "28px", fontSize: "13.5px", color: "var(--ink-soft)", opacity: 0.65, textAlign: "center", letterSpacing: "0.02em"}}>
  No shared secrets. &nbsp;·&nbsp; No loose scripts. &nbsp;·&nbsp; One control plane.
</p>
</div>
</div>
</header>

{/* Product Experience Showcase */}
<div className="aeg-wrap reveal d4 showcase-scroll-3d" style={{ marginTop: "-30px", marginBottom: "64px", position: "relative", zIndex: "2" }}>
  <div className="showcase-container showcase-container-tilt" ref={showcaseRef}>
    {/* Tab Bar */}
    <div className="showcase-tabs">
      <button 
        type="button"
        className={`showcase-tab ${showcaseTab === 'overview' ? 'is-active' : ''}`}
        onClick={() => setShowcaseTab('overview')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
        <span>Control Plane</span>
      </button>
      <button 
        type="button"
        className={`showcase-tab ${showcaseTab === 'governance' ? 'is-active' : ''}`}
        onClick={() => setShowcaseTab('governance')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        <span>Governance</span>
      </button>
      <button 
        type="button"
        className={`showcase-tab ${showcaseTab === 'inbox' ? 'is-active' : ''}`}
        onClick={() => setShowcaseTab('inbox')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
        <span>Inbox Approvals</span>
      </button>
      <button 
        type="button"
        className={`showcase-tab ${showcaseTab === 'wizard' ? 'is-active' : ''}`}
        onClick={() => setShowcaseTab('wizard')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
        <span>Setup & CLI</span>
      </button>
    </div>

    {/* Window Frame (macOS style app shell) */}
    <div className="showcase-window">
      <div className="showcase-window-header">
        <div className="window-dots">
          <span className="dot dot-red"></span>
          <span className="dot dot-yellow"></span>
          <span className="dot dot-green"></span>
        </div>
        <div className="window-address-bar">
          <svg width="10" height="10" style={{ marginRight: "4px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>agenttag.ai/app/{showcaseTab}</span>
        </div>
      </div>
      <div className="showcase-window-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={showcaseTab + '-' + theme}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ width: "100%", height: "100%", display: "flex" }}
          >
            {showcaseTab === 'overview' && (
              <StoreProvider>
                <div className="aeg-dash" style={{ position: "relative", inset: "auto", width: "100%", height: "100%", minHeight: "0", background: "transparent" }}>
                  <div className="ad-main" style={{ minHeight: "0", height: "100%" }}>
                    <OverviewPage onNav={() => {}} />
                  </div>
                </div>
              </StoreProvider>
            )}
            {showcaseTab === 'governance' && (
              <StoreProvider>
                <div className="aeg-dash" style={{ position: "relative", inset: "auto", width: "100%", height: "100%", minHeight: "0", background: "transparent" }}>
                  <div className="ad-main" style={{ minHeight: "0", height: "100%" }}>
                    <GovernancePage />
                  </div>
                </div>
              </StoreProvider>
            )}
            {showcaseTab === 'inbox' && (
              <StoreProvider>
                <div className="aeg-dash" style={{ position: "relative", inset: "auto", width: "100%", height: "100%", minHeight: "0", background: "transparent" }}>
                  <div className="ad-main" style={{ minHeight: "0", height: "100%" }}>
                    <InboxPage onNav={() => {}} />
                  </div>
                </div>
              </StoreProvider>
            )}
            {showcaseTab === 'wizard' && (
              <StoreProvider>
                <div className="aeg-dash" style={{ position: "relative", inset: "auto", width: "100%", height: "100%", minHeight: "0", background: "transparent" }}>
                  <div className="ad-main" style={{ minHeight: "0", height: "100%" }}>
                    <Wizard onClose={() => setShowcaseTab('overview')} onFinish={() => setShowcaseTab('overview')} onNav={() => {}} />
                  </div>
                </div>
              </StoreProvider>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  </div>
</div>
</div>

{/* Brand trust social proof bar — placed outside the gradient box */}
<div className="brand-social-proof reveal d5">
  <p className="infrastructure-subheader">
    Built for:
  </p>
  <div className="brand-logos-row">
    <div className="brand-logo-item">
      <span className="brand-logo-icon"><svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"></path></svg></span>
      <span>Claude Desktop</span>
    </div>
    <div className="brand-logo-item">
      <span className="brand-logo-icon"><svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><circle cx="12" cy="6" r="2.3"></circle><circle cx="5.5" cy="17" r="2.3"></circle><circle cx="18.5" cy="17" r="2.3"></circle><path d="M10.6 7.9 6.9 15M13.4 7.9 17.1 15M7.8 17h8.4"></path></svg></span>
      <span>CrewAI</span>
    </div>
    <div className="brand-logo-item">
      <span className="brand-logo-icon"><svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><path d="M9.5 13a4 4 0 0 0 5.66 0l2.5-2.5a4 4 0 0 0-5.66-5.66l-1.3 1.3"></path><path d="M14.5 11a4 4 0 0 0-5.66 0l-2.5 2.5a4 4 0 0 0 5.66 5.66l1.3-1.3"></path></svg></span>
      <span>LangChain</span>
    </div>
    <div className="brand-logo-item">
      <span className="brand-logo-icon"><svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
      <span>Any MCP or A2A client</span>
    </div>
  </div>
</div>

{/* ==================== 01 - THE SHIFT ==================== */}
<section className="aeg-section aeg-wrap" id="how">
  <div className="eyebrow">
    <span className="eyebrow-num">01</span><span className="eyebrow-label">The shift</span>
  </div>
  
  <div className="shift-header-row">
    <div className="shift-header-left">
      <h2 className="display" style={{margin: "0", fontSize: "clamp(33px, 4.6vw, 54px)", lineHeight: "1.05"}}>
        AI delegation didn’t get harder.<br />
        <span className="accent-it">It got stuck.</span>
      </h2>
    </div>
    <div className="shift-header-right">
      <p style={{margin: "0", fontSize: "16.5px", lineHeight: "1.65", color: "var(--muted)"}}>
        Wrapper scripts work in a sandbox, but collapse once agents touch money or production systems. AgentTag replaces keys with governed identities, ensuring execution compounds safely instead of drifting.
      </p>
    </div>
  </div>

  <div className="flows-container">
    {/* Card 1: Messy Flows */}
    <div className="flow-card-mess glass card-spotlight">
      <div className="flow-card-header">
        <span className="badge-mess">Your journeys are a <span className="highlight-red">mess</span></span>
      </div>
      <div className="flow-card-body">
        <svg className="flow-grid-svg" viewBox="0 0 800 280" width="100%" height="100%">

          
          {/* Lines drift clearly left→right. One stronger "spine" (tier-strong)
              carries the eye from the start phone through center to the end phone;
              medium + faint strands build the web around it without cluttering. */}

          {/* Spine — the readable left-to-right path the eye tracks */}
          <path d="M 50 140 L 215 128 L 330 108 L 470 66 L 560 84 L 660 120 L 745 150" className="messy-line tier-strong" />

          {/* Medium secondary strands */}
          <path d="M 50 140 L 120 170 L 255 185 L 360 214 L 455 160" className="messy-line tier-med" />
          <path d="M 150 96 L 215 128" className="messy-line tier-med" />
          <path d="M 255 185 L 330 108" className="messy-line tier-med" />
          <path d="M 455 160 L 560 84 L 610 200" className="messy-line tier-med" />

          {/* Faint tertiary strands — the cluttered "web" feel, barely there */}
          <path d="M 120 170 L 215 128 L 255 185" className="messy-line tier-faint" />
          <path d="M 360 214 L 455 160 L 610 200 L 660 120" className="messy-line tier-faint" />
          <path d="M 330 108 L 360 214" className="messy-line tier-faint" />
          <path d="M 470 66 L 560 84" className="messy-line tier-faint" />
          <path d="M 610 200 L 745 150" className="messy-line tier-faint" />

          {/* Failure paths — each dashed line terminates exactly at its Red X */}
          {/* err-1: node(120,170) → RedX(185,218) */}
          <path d="M 120 170 L 185 218" className="messy-line line-err" strokeDasharray="3 3" />
          {/* err-2: node(330,108) → RedX(320,58) */}
          <path d="M 330 108 L 320 58" className="messy-line line-err" strokeDasharray="3 3" />
          {/* err-3: node(455,160) → RedX(515,228) */}
          <path d="M 455 160 L 515 228" className="messy-line line-err" strokeDasharray="3 3" />
          {/* err-4: node(660,120) → RedX(700,92) — stops at X, never reaches end phone */}
          <path d="M 660 120 L 700 92" className="messy-line line-err" strokeDasharray="3 3" />

          {/* Nodes & Icons — ordered left→right */}
          {/* Phone (start) at (50, 140) */}
          <g transform="translate(50, 140)">
            <circle cx="0" cy="0" r="14" fill="var(--paper)" stroke="var(--line)" strokeWidth="1.5" />
            <rect x="-5" y="-8" width="10" height="16" rx="1.5" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            <circle cx="0" cy="5" r="0.8" fill="var(--ink)" />
          </g>

          {/* Email Envelope icon at (150, 96) */}
          <g transform="translate(150, 96)">
            <circle cx="0" cy="0" r="14" fill="var(--paper)" stroke="var(--line)" strokeWidth="1.5" />
            <rect x="-7" y="-5" width="14" height="10" rx="1" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            <path d="M-7 -3 L0 1.5 L7 -3" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
          </g>

          {/* Laptop icon at (255, 185) */}
          <g transform="translate(255, 185)">
            <circle cx="0" cy="0" r="14" fill="var(--paper)" stroke="var(--line)" strokeWidth="1.5" />
            <rect x="-7" y="-5" width="14" height="9" rx="1.2" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            <line x1="-9" y1="5" x2="9" y2="5" stroke="var(--ink)" strokeWidth="1.2" />
          </g>

          {/* Email Envelope icon at (560, 84) */}
          <g transform="translate(560, 84)">
            <circle cx="0" cy="0" r="14" fill="var(--paper)" stroke="var(--line)" strokeWidth="1.5" />
            <rect x="-7" y="-5" width="14" height="10" rx="1" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            <path d="M-7 -3 L0 1.5 L7 -3" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
          </g>

          {/* Phone (end) at (745, 150) */}
          <g transform="translate(745, 150)">
            <circle cx="0" cy="0" r="14" fill="var(--paper)" stroke="var(--line)" strokeWidth="1.5" />
            <rect x="-5" y="-8" width="10" height="16" rx="1.5" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            <circle cx="0" cy="5" r="0.8" fill="var(--ink)" />
          </g>

          {/* Red X failures — soft glassmorphism blobs (graduated red wash, no hard ring) */}
          {[
            [185, 218],
            [320, 58],
            [515, 228],
            [700, 92],
          ].map(([x, y]) => (
            <g key={`mess-x-${x}-${y}`} transform={`translate(${x}, ${y})`}>
              <circle cx="0" cy="0" r="14" fill="var(--line)" />
              <circle cx="0" cy="0" r="9" fill="var(--line-soft)" />
              <path d="M-3.5 -3.5 L3.5 3.5 M3.5 -3.5 L-3.5 3.5" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          ))}

          {/* Normal white connection nodes */}
          <circle cx="120" cy="170" r="4.5" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx="215" cy="128" r="4.5" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx="330" cy="108" r="4.5" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx="360" cy="214" r="4.5" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx="455" cy="160" r="4.5" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx="470" cy="66" r="4.5" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx="610" cy="200" r="4.5" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx="660" cy="120" r="4.5" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
        </svg>
      </div>
    </div>

    {/* Card 2: Clean flows with AgentTag */}
    <div className="flow-card-clean card-spotlight">
      <div className="flow-card-header">
        <span className="badge-clean">Clean them up with <span className="highlight-white">AgentTag</span></span>
      </div>
      <div className="flow-card-body">
        <svg className="flow-grid-svg" viewBox="0 0 800 280" width="100%" height="100%">
          {/* Grid of dots */}
          {Array.from({ length: 25 }).map((_, col) => 
            Array.from({ length: 9 }).map((_, row) => {
              const x = col * 32 + 16;
              const y = row * 30 + 20;
              return (
                <circle 
                  key={`clean-grid-${col}-${row}`} 
                  cx={x} 
                  cy={y} 
                  r={1.2} 
                  fill="currentColor" 
                  className="grid-dot-clean"
                />
              );
            })
          )}

          {/* Clean flowing paths */}
          {/* Path 1: peaky wave */}
          <path d="M 48 70 C 108 46, 108 46, 168 46 C 228 46, 228 70, 288 70 C 348 70, 348 22, 408 22 C 468 22, 468 70, 528 70 C 588 70, 588 46, 648 46 C 708 46, 708 70, 752 70" className="clean-line line-flow-1" />
          <path d="M 48 70 C 108 46, 108 46, 168 46 C 228 46, 228 70, 288 70 C 348 70, 348 22, 408 22 C 468 22, 468 70, 528 70 C 588 70, 588 46, 648 46 C 708 46, 708 70, 752 70" className="clean-line-glow line-flow-1-glow" />

          {/* Path 2: flat with minor valley */}
          <path d="M 48 140 L 168 140 C 228 140, 228 140, 288 140 C 348 140, 348 164, 408 164 C 468 164, 468 140, 528 140 L 648 140 C 708 140, 708 140, 752 140" className="clean-line line-flow-2" />
          <path d="M 48 140 L 168 140 C 228 140, 228 140, 288 140 C 348 140, 348 164, 408 164 C 468 164, 468 140, 528 140 L 648 140 C 708 140, 708 140, 752 140" className="clean-line-glow line-flow-2-glow" />

          {/* Path 3: flat with valley in middle */}
          <path d="M 48 210 L 168 210 C 228 210, 228 210, 288 210 C 348 210, 348 234, 408 234 C 468 234, 468 210, 528 210 L 648 210 C 708 210, 708 210, 752 210" className="clean-line line-flow-3" />
          <path d="M 48 210 L 168 210 C 228 210, 228 210, 288 210 C 348 210, 348 234, 408 234 C 468 234, 468 210, 528 210 L 648 210 C 708 210, 708 210, 752 210" className="clean-line-glow line-flow-3-glow" />

          {/* Nodes, Icons, and Checkmarks */}
          {/* Start User Nodes */}
          {/* User 1 at (48, 70) */}
          {/* User 1 at (48, 70) */}
          <g transform="translate(48, 70)">
            <circle cx="0" cy="0" r="14" className="clean-node-circle" />
            <circle cx="0" cy="-3" r="3.5" fill="#fff" />
            <path d="M-6 6 C-6 2.5 -3 1.8 0 1.8 C3 1.8 6 2.5 6 6" fill="#fff" />
          </g>
          {/* User 2 at (48, 140) */}
          <g transform="translate(48, 140)">
            <circle cx="0" cy="0" r="14" className="clean-node-circle" />
            <circle cx="0" cy="-3" r="3.5" fill="#fff" />
            <path d="M-6 6 C-6 2.5 -3 1.8 0 1.8 C3 1.8 6 2.5 6 6" fill="#fff" />
          </g>
          {/* User 3 at (48, 210) */}
          <g transform="translate(48, 210)">
            <circle cx="0" cy="0" r="14" className="clean-node-circle" />
            <circle cx="0" cy="-3" r="3.5" fill="#fff" />
            <path d="M-6 6 C-6 2.5 -3 1.8 0 1.8 C3 1.8 6 2.5 6 6" fill="#fff" />
          </g>
 
          {/* Line 1 Nodes */}
          {/* Phone at (168, 46) */}
          <g transform="translate(168, 46)">
            <circle cx="0" cy="0" r="14" className="clean-node-circle" />
            <rect x="-5" y="-8" width="10" height="16" rx="1.5" fill="none" stroke="#fff" strokeWidth="1.2" />
            <circle cx="0" cy="5" r="0.8" fill="#fff" />
          </g>
          {/* Email at (408, 22) */}
          <g transform="translate(408, 22)">
            <circle cx="0" cy="0" r="14" className="clean-node-circle" />
            <rect x="-7" y="-5" width="14" height="10" rx="1" fill="none" stroke="#fff" strokeWidth="1.2" />
            <path d="M-7 -3 L0 1.5 L7 -3" fill="none" stroke="#fff" strokeWidth="1.2" />
          </g>
          {/* Chat at (648, 46) */}
          <g transform="translate(648, 46)">
            <circle cx="0" cy="0" r="14" className="clean-node-circle" />
            <rect x="-7" y="-5" width="14" height="10" rx="1.5" fill="none" stroke="#fff" strokeWidth="1.2" />
            <circle cx="-3" cy="-1" r="0.8" fill="#fff" />
            <circle cx="0" cy="-1" r="0.8" fill="#fff" />
            <circle cx="3" cy="-1" r="0.8" fill="#fff" />
          </g>
 
          {/* Line 2 Nodes */}
          {/* Phone at (288, 140) */}
          <g transform="translate(288, 140)">
            <circle cx="0" cy="0" r="14" className="clean-node-circle" />
            <rect x="-5" y="-8" width="10" height="16" rx="1.5" fill="none" stroke="#fff" strokeWidth="1.2" />
            <circle cx="0" cy="5" r="0.8" fill="#fff" />
          </g>
          {/* Chat at (408, 164) */}
          <g transform="translate(408, 164)">
            <circle cx="0" cy="0" r="14" className="clean-node-circle" />
            <rect x="-7" y="-5" width="14" height="10" rx="1.5" fill="none" stroke="#fff" strokeWidth="1.2" />
            <circle cx="-3" cy="-1" r="0.8" fill="#fff" />
            <circle cx="0" cy="-1" r="0.8" fill="#fff" />
            <circle cx="3" cy="-1" r="0.8" fill="#fff" />
          </g>
 
          {/* Line 3 Nodes */}
          {/* Laptop at (168, 210) */}
          <g transform="translate(168, 210)">
            <circle cx="0" cy="0" r="14" className="clean-node-circle" />
            <rect x="-7" y="-5" width="14" height="9" rx="1.2" fill="none" stroke="#fff" strokeWidth="1.2" />
            <line x1="-9" y1="5" x2="9" y2="5" stroke="#fff" strokeWidth="1.2" />
          </g>
          {/* Email at (408, 234) */}
          <g transform="translate(408, 234)">
            <circle cx="0" cy="0" r="14" className="clean-node-circle" />
            <rect x="-7" y="-5" width="14" height="10" rx="1" fill="none" stroke="#fff" strokeWidth="1.2" />
            <path d="M-7 -3 L0 1.5 L7 -3" fill="none" stroke="#fff" strokeWidth="1.2" />
          </g>
 
          {/* Intermediate white dots */}
          <circle cx="288" cy="70" r="4.5" className="clean-node-dot" />
          <circle cx="528" cy="70" r="4.5" className="clean-node-dot" />
          <circle cx="168" cy="140" r="4.5" className="clean-node-dot" />
          <circle cx="528" cy="140" r="4.5" className="clean-node-dot" />
          <circle cx="648" cy="140" r="4.5" className="clean-node-dot" />
          <circle cx="288" cy="210" r="4.5" className="clean-node-dot" />
          <circle cx="528" cy="210" r="4.5" className="clean-node-dot" />
          <circle cx="648" cy="210" r="4.5" className="clean-node-dot" />

          {/* Final Monochrome Checkmark Nodes */}
          {/* Checkmark 1 at (752, 70) */}
          <g transform="translate(752, 70)">
            <circle cx="0" cy="0" r="11" fill="var(--ink)" stroke="var(--paper)" strokeWidth="1.5" />
            <path d="M-4 0 L-1 3 L4 -3" fill="none" stroke="var(--paper)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {/* Checkmark 2 at (752, 140) */}
          <g transform="translate(752, 140)">
            <circle cx="0" cy="0" r="11" fill="var(--ink)" stroke="var(--paper)" strokeWidth="1.5" />
            <path d="M-4 0 L-1 3 L4 -3" fill="none" stroke="var(--paper)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {/* Checkmark 3 at (752, 210) */}
          <g transform="translate(752, 210)">
            <circle cx="0" cy="0" r="11" fill="var(--ink)" stroke="var(--paper)" strokeWidth="1.5" />
            <path d="M-4 0 L-1 3 L4 -3" fill="none" stroke="var(--paper)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </div>
    </div>
  </div>
</section>
{/* ==================== 02 - THE FIVE PRIMITIVES ==================== */}
<section className="aeg-section aeg-wrap" id="primitives">
<div className="eyebrow">
<span className="eyebrow-num">02</span><span className="eyebrow-label">The platform</span>
</div>
<h2 className="display" style={{margin: "0 0 16px", fontSize: "clamp(33px, 4.6vw, 54px)", lineHeight: "1.05"}}>One control plane to <span className="accent-it">govern every agent.</span></h2>
<p style={{maxWidth: "560px", margin: "0 0 44px", fontSize: "17px", lineHeight: "1.65", color: "var(--muted)"}}>AgentTag sits between your agents and the world. Every action flows through one policy engine, one identity layer, and one tamper‑evident ledger — whatever framework, tool, or cloud you use.</p>
<div className="gov-flow">
{/* Your agents */}
<div className="gov-col">
<div className="gov-col-label">Your agents</div>
<div className="gov-node"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="2.3"></circle><circle cx="5.5" cy="17" r="2.3"></circle><circle cx="18.5" cy="17" r="2.3"></circle><path d="M10.6 7.9 6.9 15M13.4 7.9 17.1 15M7.8 17h8.4"></path></svg>CrewAI</div>
<div className="gov-node"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 13a4 4 0 0 0 5.66 0l2.5-2.5a4 4 0 0 0-5.66-5.66l-1.3 1.3"></path><path d="M14.5 11a4 4 0 0 0-5.66 0l-2.5 2.5a4 4 0 0 0 5.66 5.66l1.3-1.3"></path></svg>LangChain</div>
<div className="gov-node"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"></path></svg>Claude Desktop</div>
<div className="gov-col-foot">+ any MCP / A2A client</div>
</div>

{/* request arrow */}
<div className="gov-arrow">
<svg width="30" height="14" viewBox="0 0 30 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h24M20 2l6 5-6 5"></path></svg>
<span>request</span>
</div>

{/* control plane core */}
<div className="gov-core">
<div className="gov-core-head">
<div className="gov-core-crest"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"></path><path d="M8.5 12l2.4 2.4L15.8 9" strokeLinecap="round"></path></svg></div>
<span className="gov-core-title">AgentTag Control Plane</span>
<span className="gov-chip-live">GOVERNING</span>
</div>
<div className="gov-layer">
<div className="gov-layer-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l7 3v6c0 4.5-3 8-7 9.5C8 19 5 15.5 5 11V5l7-3z"></path><path d="M9 11.5l2 2 4-4.5"></path></svg></div>
<div><div className="gov-layer-t">Policy engine</div><div className="gov-layer-d">Evaluates every call against your mandates and returns allow, step‑up, or deny.</div></div>
</div>
<div className="gov-layer">
<div className="gov-layer-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="10" r="2"></circle><path d="M5.5 17a3.5 3.5 0 0 1 7 0M15 9h4M15 13h4"></path></svg></div>
<div><div className="gov-layer-t">Identity &amp; mandates</div><div className="gov-layer-d">Issues DID‑signed passports and scoped, expiring capability tokens for each agent.</div></div>
</div>
<div className="gov-layer">
<div className="gov-layer-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg></div>
<div><div className="gov-layer-t">Audit ledger</div><div className="gov-layer-d">Hash‑chains every action into a tamper‑evident record.</div></div>
</div>
</div>

{/* signed action arrow */}
<div className="gov-arrow">
<svg width="30" height="14" viewBox="0 0 30 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h24M20 2l6 5-6 5"></path></svg>
<span>signed action</span>
</div>

{/* real-world tools */}
<div className="gov-col">
<div className="gov-col-label">Real-world tools</div>
<div className="gov-node"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>Pay</div>
<div className="gov-node"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>Comms</div>
<div className="gov-node"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="6" rx="1.5"></rect><rect x="3" y="14" width="18" height="6" rx="1.5"></rect><line x1="7" y1="7" x2="7.01" y2="7"></line><line x1="7" y1="17" x2="7.01" y2="17"></line></svg>Deploy</div>
<div className="gov-node"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>Vault</div>
<div className="gov-col-foot">across every cloud</div>
</div>
</div>

{/* platform guarantees */}
<div className="gov-pillars">
<div className="gov-pillar">
<div className="gov-pillar-ico"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"></path><path d="M9 11.5l2 2 4-4.5"></path></svg></div>
<div className="gov-pillar-t">Policy engine</div>
<div className="gov-pillar-d">Evaluates every call against your mandates and returns allow, step‑up, or deny.</div>
</div>
<div className="gov-pillar">
<div className="gov-pillar-ico"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"></path><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"></path><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"></path><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"></path><path d="M8.65 22c.21-.66.45-1.32.57-2"></path><path d="M14 13.12c0 2.38 0 6.38-1 8.88"></path><path d="M2 16h.01"></path><path d="M21.8 16c.2-2 .131-5.354 0-6"></path><path d="M9 6.8a6 6 0 0 1 9 5.2v2"></path></svg></div>
<div className="gov-pillar-t">Identity &amp; mandates</div>
<div className="gov-pillar-d">Issues DID‑signed passports and scoped, expiring capability tokens for each agent.</div>
</div>
<div className="gov-pillar">
<div className="gov-pillar-ico"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg></div>
<div className="gov-pillar-t">Audit ledger</div>
<div className="gov-pillar-d">Hash‑chains every action into a tamper‑evident record.</div>
</div>
<div className="gov-pillar">
<div className="gov-pillar-ico"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 3 7v10l9 5 9-5V7l-9-5z"></path><path d="M3 7l9 5 9-5"></path><path d="M12 22V12"></path></svg></div>
<div className="gov-pillar-t">Sandboxed compute</div>
<div className="gov-pillar-d">Runs actions in isolated environments with narrow access.</div>
</div>
</div>
</section>
{/* ==================== MCP TOOL SURFACE ==================== */}
<section className="aeg-section aeg-wrap" id="surface">
<div className="eyebrow">
<span className="eyebrow-num">03</span><span className="eyebrow-label">The tool surface</span>
</div>
<h2 className="display" style={{margin: "0 0 16px", fontSize: "clamp(33px, 4.6vw, 54px)", lineHeight: "1.05"}}>One MCP server. <span className="accent-it">Eight tools.</span></h2>
<p style={{maxWidth: "540px", margin: "0 0 50px", fontSize: "17px", lineHeight: "1.65", color: "var(--muted)"}}>Drop AgentTag into Claude Desktop or any MCP‑compatible agent. The agent sees only governed tools; every call goes through policy, vault, and audit, and no capability runs without a verdict.</p>
<div className="mcp-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", alignItems: "stretch"}}>
{/* tool API */}
<div className="panel-dark">
<div className="z" style={{display: "flex", alignItems: "center", gap: "10px", padding: "14px 20px", borderBottom: "1px solid var(--line)"}}>
<span className="win-dots" style={{display: "flex", gap: "6px"}}><span></span><span></span><span></span></span>
<span className="mono" style={{fontSize: "12px", color: "var(--muted)", marginLeft: "4px"}}>agenttag · tools</span>
</div>
<div className="mcp-tools z">
<span className="mcp-tool"><b>browse</b>(action, target)</span><span className="mcp-cmt">// drive the browser</span>
<span className="mcp-tool"><b>comms.send</b>(channel, to, body)</span><span className="mcp-cmt">// email / sms</span>
<span className="mcp-tool"><b>comms.verify</b>(sess)</span><span className="mcp-cmt">// read OTP / link</span>
<span className="mcp-tool"><b>pay</b>(amount, merchant, card?)</span><span className="mcp-cmt">// virtual card</span>
<span className="mcp-tool"><b>deploy</b>(project, files, env)</span><span className="mcp-cmt">// build &amp; host</span>
<span className="mcp-tool"><b>provision</b>(kind)</span><span className="mcp-cmt">// new inbox / phone</span>
<span className="mcp-tool"><b>vault.use</b>(handle, …)</span><span className="mcp-cmt">// use, never read</span>
<span className="mcp-tool"><b>approve</b>(action, ctx)</span><span className="mcp-cmt">// ask the human</span>
</div>
</div>
{/* quickstart */}
<div className="card card-spotlight" style={{padding: "0", overflow: "hidden", display: "flex", flexDirection: "column"}}>
<div style={{padding: "24px 28px 18px"}}>
<span style={{fontWeight: "600", fontSize: "16px", color: "var(--ink)"}}>Connect in 30 seconds.</span>
<p style={{margin: "8px 0 0", fontSize: "14px", lineHeight: "1.6", color: "var(--muted)"}}>Add the server to your MCP client and the tools appear in the agent automatically. The agent can request actions, but nothing completes unless policy allows it.</p>
</div>
<div className="panel-dark" style={{borderRadius: "0", borderLeft: "0", borderRight: "0", flex: "1"}}>
<MCPConsole />
</div>
</div>
</div>
<p style={{marginTop: "24px", textAlign: "center", fontSize: "14.5px", color: "var(--muted)"}}>
  The agent can request actions, but nothing completes unless policy allows it.
</p>
</section>
{/* ==================== 04 - POLICY GRID ==================== */}
<section className="aeg-section aeg-wrap" id="policy">
<div className="policy-header">
<div className="eyebrow" style={{marginBottom: "12px"}}>
<span className="eyebrow-num">04</span><span className="eyebrow-label">Platform governing</span>
</div>
<h2 className="display" style={{margin: "0 0 16px", fontSize: "clamp(33px, 4.6vw, 54px)", lineHeight: "1.05"}}>Everything you need to govern <span className="accent-it">AI action.</span></h2>
<p style={{maxWidth: "580px", margin: "0 0 40px", fontSize: "17px", lineHeight: "1.65", color: "var(--muted)"}}>Track, analyze, and authorize every request made by your autonomous agents across tools, hosts, and networks in real time.</p>
</div>
<div className="policy-grid">
{/* Box 1 (col-8): Every node in any cloud */}
<div className="card policy-card col-8 card-spotlight">
<div>
<h3 className="policy-card-title">Every node <span>in any cloud</span></h3>
<p className="policy-card-desc" style={{maxWidth: "480px"}}>Govern execution across private microVMs, secure credential enclaves, and KMS-backed environments.</p>
</div>
<div className="map-container">
{/* Animated dotted world map with copper connection arcs */}
<WorldMap
  theme={theme === 'dark' ? 'dark' : 'light'}
  lineColor={theme === 'dark' ? '#ffffff' : '#000000'}
  dots={[
    { start: { lat: 64.2008, lng: -149.4937 }, end: { lat: 34.0522, lng: -118.2437 } }, // Alaska -> Los Angeles
    { start: { lat: 64.2008, lng: -149.4937 }, end: { lat: -15.7975, lng: -47.8919 } }, // Alaska -> Brasília
    { start: { lat: -15.7975, lng: -47.8919 }, end: { lat: 38.7223, lng: -9.1393 } },   // Brasília -> Lisbon
    { start: { lat: 51.5074, lng: -0.1278 }, end: { lat: 28.6139, lng: 77.209 } },      // London -> New Delhi
    { start: { lat: 28.6139, lng: 77.209 }, end: { lat: 43.1332, lng: 131.9113 } },     // New Delhi -> Vladivostok
    { start: { lat: 28.6139, lng: 77.209 }, end: { lat: -1.2921, lng: 36.8219 } },      // New Delhi -> Nairobi
  ]}
/>
</div>
</div>
{/* Box 2 (col-4): Govern any agent */}
<div className="card policy-card col-4 card-spotlight">
<div>
<h3 className="policy-card-title">Govern <span>any agent</span></h3>
<p className="policy-card-desc">Apply the same rules across CrewAI, LangChain, Claude Desktop, and any MCP or A2A client.</p>
</div>
<div className="framework-list">
<div className="framework-item">
<div className="framework-info">
<div className="framework-icon-tile" style={{background: "var(--surface)", color: "var(--ink)"}}>
{/* CrewAI — multi-agent squad */}
<svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15"><circle cx="12" cy="6" r="2.3"></circle><circle cx="5.5" cy="17" r="2.3"></circle><circle cx="18.5" cy="17" r="2.3"></circle><path d="M10.6 7.9 6.9 15M13.4 7.9 17.1 15M7.8 17h8.4"></path></svg>
</div>
<span className="framework-name">CrewAI</span>
</div>
<span className="aeg-chip aeg-chip--ok">Governed</span>
</div>
<div className="framework-item">
<div className="framework-info">
<div className="framework-icon-tile" style={{background: "var(--surface)", color: "var(--ink)"}}>
{/* LangChain — chain links */}
<svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15"><path d="M9.5 13a4 4 0 0 0 5.66 0l2.5-2.5a4 4 0 0 0-5.66-5.66l-1.3 1.3"></path><path d="M14.5 11a4 4 0 0 0-5.66 0l-2.5 2.5a4 4 0 0 0 5.66 5.66l1.3-1.3"></path></svg>
</div>
<span className="framework-name">LangChain</span>
</div>
<span className="aeg-chip aeg-chip--ok">Governed</span>
</div>
<div className="framework-item">
<div className="framework-info">
<div className="framework-icon-tile" style={{background: "var(--surface)", color: "var(--ink)"}}>
{/* Claude — radial burst */}
<svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="15"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"></path></svg>
</div>
<span className="framework-name">Claude Desktop</span>
</div>
<span className="aeg-chip aeg-chip--ok">Governed</span>
</div>
<div className="policy-foot">
<svg fill="none" height="11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="11"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>
9 more · any MCP / A2A client
</div>
</div>
</div>
{/* Box 3 (col-4): Connect your tools */}
<div className="card policy-card col-4 card-spotlight">
<div>
<h3 className="policy-card-title">Connect <span>your tools</span></h3>
<p className="policy-card-desc">Bind third-party credentials behind secure, sandboxed API surfaces.</p>
</div>
      <div className="integration-list">
        <div className="integration-item">
          <div className="integration-meta">
            <div className="integration-logo">
              {/* Stripe - outline credit card SVG */}
              <svg fill="none" height="15" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" width="15"><rect height="14" rx="2" ry="2" width="20" x="2" y="5"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>
            </div>
            <div>
              <p className="integration-name">Stripe Payments</p>
              <p className="integration-desc">Process virtual cards</p>
            </div>
          </div>
          <span className="aeg-chip aeg-chip--ok">Connected</span>
        </div>
        <div className="integration-item">
          <div className="integration-meta">
            <div className="integration-logo">
              {/* GitHub - outline git branch SVG */}
              <svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="15"><line x1="6" x2="6" y1="3" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
            </div>
            <div>
              <p className="integration-name">GitHub Actions</p>
              <p className="integration-desc">Scoped deploy tokens</p>
            </div>
          </div>
          <span className="aeg-chip aeg-chip--ok">Connected</span>
        </div>
        {extraTools.map((t) => {
          return (
            <div className="integration-item" key={t.name}>
              <div className="integration-meta">
                <div className="integration-logo">
                  {toolIcons[t.name] || (
                    <svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="15"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path></svg>
                  )}
                </div>
                <div>
                  <p className="integration-name">{t.name}</p>
                  <p className="integration-desc">{t.desc}</p>
                </div>
              </div>
              <span className={t.status === "connecting" ? "aeg-chip" : "aeg-chip aeg-chip--ok"} style={t.status === "connecting" ? {color: "var(--ink)", background: "var(--surface)", borderColor: "var(--line)"} : undefined}>{t.status === "connecting" ? "Connecting…" : "Connected"}</span>
              <span className={t.status === "connecting" ? "aeg-chip" : "aeg-chip aeg-chip--ok"} style={t.status === "connecting" ? {color: "var(--ink)", background: "var(--surface)", borderColor: "var(--line)"} : undefined}>{t.status === "connecting" ? "Provisioning…" : "Protected"}</span>
            </div>
          );
        })}
        {extraTools.length < newToolPool.length && (
          <button className="integration-add" type="button" onClick={connectTool}>
            <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="12"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>
            Add new integration
          </button>
        )}
      </div>
    </div>
    {/* Box 4 (col-4): Biometric WebAuthn consent */}
    <div className="card policy-card col-4 card-spotlight">
      <div>
        <h3 className="policy-card-title">Biometric <span>consent</span></h3>
        <p className="policy-card-desc">Fails closed on timeouts. Authorizations require on-device biometric check signed by your key.</p>
      </div>
      <div className="scanner-wrap">
        <div className="scanner-glow"></div>
        <div className="scanner-face-overlay"></div>
        {/* Biometric Face / Fingerprint Stylized SVG */}
        <svg fill="none" height="150" style={{opacity: "0.95"}} viewBox="0 0 200 200" width="150" xmlns="http://www.w3.org/2000/svg">
          {/* Outer dashed circles — slow counter-rotating rings */}
          <g className="scanner-rings">
            <circle cx="100" cy="100" fill="none" opacity="0.2" r="75" stroke="var(--crimson)" strokeDasharray="4 4" strokeWidth="1"></circle>
          </g>
          <g className="scanner-rings scanner-rings--rev">
            <circle cx="100" cy="100" fill="none" opacity="0.12" r="55" stroke="var(--crimson)" strokeDasharray="3 3" strokeWidth="1"></circle>
          </g>
          {/* Tech Scanner Corners */}
          <path d="M 40 60 L 40 40 L 60 40" fill="none" stroke="var(--crimson)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M 160 60 L 160 40 L 140 40" fill="none" stroke="var(--crimson)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M 40 140 L 40 160 L 60 160" fill="none" stroke="var(--crimson)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M 160 140 L 160 160 L 140 160" fill="none" stroke="var(--crimson)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" strokeLinejoin="round"></path>
          {/* Scanning Grid lines */}
          <line x1="100" y1="25" x2="100" y2="175" stroke="var(--crimson)" strokeWidth="0.5" opacity="0.08" strokeDasharray="2 4"></line>
          <line x1="25" y1="100" x2="175" y2="100" stroke="var(--crimson)" strokeWidth="0.5" opacity="0.08" strokeDasharray="2 4"></line>
          <g transform="translate(50, 50) scale(4.2)" stroke="var(--crimson)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
            <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
            <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
            <path d="M2 12a10 10 0 0 1 18-6" />
            <path d="M2 16h.01" />
            <path d="M21.8 16c.2-2 .131-5.354 0-6" />
            <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
            <path d="M8.65 22c.21-.66.45-1.32.57-2" />
            <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
          </g>
        </svg>
        <div className="scanner-bar"></div>
        <div className="scanner-indicator"><svg fill="none" height="9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" width="9" style={{marginRight: "5px", verticalAlign: "-1px"}}><polyline points="20 6 9 17 4 12"></polyline></svg>Passkey Ready</div>
      </div>
</div>
{/* Box 5 (col-4): Durable mandates ledger */}
<div className="card policy-card col-4 card-spotlight">
<div>
<h3 className="policy-card-title">Durable <span>mandates ledger</span></h3>
<p className="policy-card-desc">Every decision is logged and cryptographically verifiable.</p>
</div>
<div className="ledger-box">
<div className="ledger-box-header">
<span>governance-logs.json</span>
<span className="aeg-chip aeg-chip--live">LIVE</span>
</div>
<div className="ledger-box-body">
<div className="ledger-search-bar">
<svg fill="none" height="12" stroke="var(--muted)" strokeWidth="2.5" viewBox="0 0 24 24" width="12"><circle cx="11" cy="11" r="8"></circle><line x1="21" x2="16.65" y1="21" y2="16.65"></line></svg>
<input className="ledger-search-input" placeholder="Search active mandates..." type="text" value={mandateQuery} onChange={(e) => setMandateQuery(e.target.value)}/>
</div>
<div className="ledger-list">
{filteredMandates.map((m) => (
<div className="ledger-list-item" key={m.name}>
<span style={{color: "var(--muted)"}}>{m.name}</span>
<span className="aeg-chip aeg-chip--ok">ACTIVE</span>
</div>
))}
{filteredMandates.length === 0 && !evalRowVisible && mandateQuery && (
<div className="ledger-list-item" style={{justifyContent: "center"}}>
<span style={{color: "var(--faint)", fontSize: "12px"}}>No mandates match “{mandateQuery}”</span>
</div>
)}
<div className="ledger-list-item" style={{borderColor: "var(--line)", background: "var(--surface)", display: evalRowVisible ? "flex" : "none"}}>
<span style={{color: "var(--ink)", fontWeight: "550", maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>eval: {"{"}{policyReq}{"}"}</span>
<span className="aeg-chip" style={{color: policyColor, background: `color-mix(in srgb, ${policyColor} 12%, transparent)`, borderColor: `color-mix(in srgb, ${policyColor} 28%, transparent)`}}>{policyVerdict}</span>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
{/* ==================== APPROVAL LOOP ==================== */}
<section className="aeg-section aeg-wrap">
<div className="panel-dark" style={{padding: "0", borderRadius: "24px"}}>
<div className="grid-2 z" style={{display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: "0"}}>
<div style={{padding: "52px 44px"}}>
<span className="kicker" style={{color: "var(--crimson-br)"}}>The human holds the pen</span>
<h2 className="display" style={{margin: "16px 0 16px", fontSize: "clamp(33px, 4.4vw, 52px)", lineHeight: "1.06", color: "var(--ink)"}}>Interrupted only when it <span className="accent-it">genuinely matters.</span></h2>
<p style={{maxWidth: "440px", margin: "0 0 28px", fontSize: "16px", lineHeight: "1.7", color: "var(--muted)"}}>Routine work runs untouched. When the agent reaches a new payee, a spend over your threshold, or anything irreversible, it pauses and asks — and your approval is signed on-device, never a blank cheque.</p>
<div style={{display: "flex", flexWrap: "wrap", gap: "10px"}}>
<span className="mono" style={{fontSize: "12.5px", color: "var(--muted)", padding: "7px 13px", borderRadius: "8px", background: "var(--paper)", border: "1px solid var(--line)"}}>Always-allow learns your boundaries</span>
<span className="mono" style={{fontSize: "12.5px", color: "var(--muted)", padding: "7px 13px", borderRadius: "8px", background: "var(--paper)", border: "1px solid var(--line)"}}>Fails closed on timeout</span>
</div>
</div>
<div className="approval-visual-col">
<div className="approval-card" style={{position: "relative", width: "100%", maxWidth: "320px", borderRadius: "8px", padding: "22px", background: "var(--paper-2)", WebkitBackdropFilter: "blur(16px) saturate(1.4)", backdropFilter: "blur(16px) saturate(1.4)", border: "1px solid var(--line)", boxShadow: "var(--shadow-lift)"}}>
<div style={{display: "flex", alignItems: "center", gap: "9px", marginBottom: "16px"}}>
  <img src={theme === 'dark' ? "/logo_bgremoved_inverted.png" : "/logo_bgremoved.png"} alt="AgentTag" height="18" style={{ height: "18px", width: "auto" }} />
<span style={{fontWeight: "700", fontSize: "13px", color: "var(--ink)"}}>AgentTag</span>
{(() => {
  const chip = {
    pending: { label: "STEP-UP", color: "var(--ink)", bg: "var(--surface)", bd: "var(--line)", pulse: true },
    approved: { label: "APPROVED", color: "var(--ok)", bg: "color-mix(in srgb, var(--ok) 12%, transparent)", bd: "color-mix(in srgb, var(--ok) 28%, transparent)", pulse: false },
    denied: { label: "DENIED", color: "var(--bad)", bg: "color-mix(in srgb, var(--bad) 12%, transparent)", bd: "color-mix(in srgb, var(--bad) 28%, transparent)", pulse: false },
  }[approval];
  return (
    <span className="mono" style={{marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "10.5px", fontWeight: "600", letterSpacing: ".5px", color: chip.color, padding: "3px 9px", borderRadius: "999px", background: chip.bg, border: `1px solid ${chip.bd}`, transition: "color .3s var(--ease), background-color .3s var(--ease), border-color .3s var(--ease)"}}>
      <span className="dot" style={{width: "5px", height: "5px", background: chip.color, ...(chip.pulse ? { animation: "aeg-pulse 1.6s ease-in-out infinite" } : {})}}></span>{chip.label}
    </span>
  );
})()}
</div>
<p style={{margin: "0 0 6px", fontSize: "14.5px", lineHeight: "1.5", color: "var(--ink)"}}>Agent <b>Research</b> wants to pay <b style={{color: "var(--crimson-deep)"}}>$840.00</b> to <b>Acme Data Inc</b></p>
<p style={{margin: "0 0 18px", fontSize: "12.5px", color: "var(--muted)"}}>category: data · <span style={{color: "var(--warn)"}}>new merchant</span> · mnd_01H…</p>
{approval === "pending" ? (
  <div style={{display: "flex", gap: "8px"}}>
    <button className="btn btn-crimson" style={{flex: "1", justifyContent: "center", padding: "10px"}} onClick={() => setApproval("approved")}>Approve</button>
    <button className="btn btn-ghost" style={{flex: "none", padding: "10px 16px"}} onClick={() => setApproval("denied")}>Deny</button>
  </div>
) : (
  <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
    <span style={{flex: "1", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", fontSize: "13px", fontWeight: "600", borderRadius: "8px", color: approval === "approved" ? "var(--ok)" : "var(--bad)", background: approval === "approved" ? "color-mix(in srgb, var(--ok) 10%, transparent)" : "color-mix(in srgb, var(--bad) 10%, transparent)", border: `1px solid ${approval === "approved" ? "color-mix(in srgb, var(--ok) 30%, transparent)" : "color-mix(in srgb, var(--bad) 30%, transparent)"}`}}>
      {approval === "approved" ? "✓ Approved & signed" : "✕ Denied"}
    </span>
    <button className="btn btn-ghost" style={{flex: "none", padding: "10px 14px"}} onClick={() => setApproval("pending")}>Reset</button>
  </div>
)}
<p style={{margin: "12px 0 0", textAlign: "center", fontSize: "11px", color: "var(--faint)"}}>Signed with your passkey · on-device</p>
</div>
</div>
</div>
</div>
</section>
{/* ==================== 05 - AUDIT LEDGER ==================== */}
<section className="aeg-section aeg-wrap" id="ledger">
<div className="eyebrow">
<span className="eyebrow-num">05</span><span className="eyebrow-label">Audit ledger</span>
</div>
<h2 className="display" style={{margin: "0 0 16px", fontSize: "clamp(33px, 4.6vw, 54px)", lineHeight: "1.05"}}>Every action, signed <span className="accent-it">and chained.</span></h2>
<p style={{maxWidth: "520px", margin: "0 0 50px", fontSize: "17px", lineHeight: "1.65", color: "var(--muted)"}}>A tamper‑evident ledger records every request, decision, and approval. Hash‑chaining makes quiet rewrites impossible.</p>
<div className="panel-dark">
<div className="z" style={{display: "flex", alignItems: "center", gap: "10px", padding: "15px 20px", borderBottom: "1px solid var(--line)"}}>
<span className="win-dots" style={{display: "flex", gap: "6px"}}><span></span><span></span><span></span></span>
<span className="mono" style={{fontSize: "12.5px", color: "var(--muted)", marginLeft: "6px"}}>agenttag · audit ledger</span>
<span className="mono" style={{marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ok)"}}><span className="dot" style={{width: "6px", height: "6px", background: "var(--ok)", boxShadow: "0 0 7px var(--ok)", animation: "aeg-pulse 1.6s ease-in-out infinite"}}></span>live</span>
</div>
<div className="mono z" style={{padding: "6px 0", fontSize: "13px", minHeight: "284px"}}>
{ledgerRows.map((row, idx) => (
<div key={row.seq ?? idx} className="row-led font-tabular" style={{display: "grid", gridTemplateColumns: "54px 78px 1fr auto 78px", alignItems: "center", gap: "10px", padding: "9px 20px", borderBottom: "1px solid var(--line)", animation: "aeg-rise .4s var(--ease)"}}>
<span style={{color: "var(--faint)"}}>#{row.seq}</span>
<span style={{color: "var(--muted)", fontSize: "11.5px"}}>{row.ev}</span>
<span style={{color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{row.act}</span>
<span style={{color: row.color, fontWeight: "500", textAlign: "right"}}>{row.v}</span>
<span style={{color: "var(--faint)", textAlign: "right"}}>{row.hash}</span>
</div>
))}
</div>
<div className="mono z" style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid var(--line)", fontSize: "12px", color: "var(--muted)"}}>
<span style={{color: "var(--ok)"}}>✓ Chain verified</span>
<span>{ledgerCount} entries · prev_hash linked</span>
</div>
</div>
</section>
{/* ==================== PASSPORT + MANDATE ==================== */}
<section className="aeg-section aeg-wrap">
<div className="grid-2" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px"}}>
{/* Passport */}
<div className="card card-spotlight" style={{padding: "0", overflow: "hidden", display: "flex", flexDirection: "column"}}>
<div style={{padding: "30px 32px 26px"}}>
<div style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px"}}>
  <img src={theme === 'dark' ? "/logo_bgremoved_inverted.png" : "/logo_bgremoved.png"} alt="AgentTag" height="19" style={{ height: "19px", width: "auto" }} />
<span style={{fontWeight: "600", fontSize: "18px", color: "var(--ink)"}}>The Passport</span>
</div>
<p style={{margin: "0", fontSize: "15px", lineHeight: "1.62", color: "var(--muted)"}}>Every agent gets its own cryptographic DID and signing key. Revoke it once and its authority stops.</p>
</div>
<div style={{marginTop: "auto", padding: "6px 32px 30px"}}>
<div style={{background: "var(--paper-2)", border: "1px solid var(--line-soft)", borderRadius: "var(--r-md)", padding: "6px 18px"}}>
<div className="field-row">
<span className="field-k"><svg fill="none" height="15" style={{opacity: ".55"}} viewBox="0 0 24 24" width="15"><circle cx="12" cy="8" r="3.4" stroke="var(--crimson)" strokeWidth="1.6"></circle><path d="M5 19c1.2-3 4-4.5 7-4.5s5.8 1.5 7 4.5" stroke="var(--crimson)" strokeLinecap="round" strokeWidth="1.6"></path></svg>Agent DID</span>
<span className="field-v mono" style={{fontSize: "12px"}}>did:key:z6Mk…AGENT</span>
</div>
<div className="field-row">
<span className="field-k"><svg fill="none" height="15" style={{opacity: ".55"}} viewBox="0 0 24 24" width="15"><path d="M12 2.5l7 3v5.5c0 4.2-2.9 7.4-7 8.5-4.1-1.1-7-4.3-7-8.5V5.5l7-3z" stroke="var(--crimson)" strokeWidth="1.5"></path></svg>Operator</span>
<span className="field-v mono" style={{fontSize: "12px"}}>did:key:z6Mk…HUMAN</span>
</div>
<div className="field-row">
<span className="field-k">Signing key</span>
<span className="allow-chip">Ed25519</span>
</div>
<div className="field-row">
<span className="field-k">Status</span>
<span style={{display: "flex", alignItems: "center", gap: "9px"}}><span className="field-v" style={{color: "var(--ok)"}}>Active</span><span className="toggle-on"></span></span>
</div>
<div className="field-row">
<span className="field-k">Operator proof</span>
<span className="field-v" style={{display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--ok)"}}><svg fill="none" height="14" viewBox="0 0 24 24" width="14"><path d="M5 12.5l4 4 10-10.5" stroke="var(--ok)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4"></path></svg>signed</span>
</div>
</div>
</div>
</div>
{/* Mandate */}
<div className="card card-spotlight" style={{padding: "0", overflow: "hidden", display: "flex", flexDirection: "column"}}>
<div style={{padding: "30px 32px 26px"}}>
<div style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px"}}>
<svg fill="none" height="19" viewBox="0 0 24 24" width="19"><path d="M5 3.5h11l3 3V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" fill="var(--crimson-tint)" stroke="var(--crimson)" strokeWidth="1.5"></path><path d="M7.5 12l1.8 1.8 3.7-3.8" stroke="var(--crimson)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path></svg>
<span style={{fontWeight: "600", fontSize: "18px", color: "var(--ink)"}}>The Mandate</span>
</div>
<p style={{margin: "0", fontSize: "15px", lineHeight: "1.62", color: "var(--muted)"}}>A human‑signed mandate defines what an agent can do, what it can spend, when it must ask, and when access expires.</p>
</div>
<div style={{marginTop: "auto", padding: "6px 32px 30px"}}>
<div style={{background: "var(--paper-2)", border: "1px solid var(--line-soft)", borderRadius: "var(--r-md)", padding: "6px 18px"}}>
<div className="field-row">
<span className="field-k">Capability</span>
<span className="allow-chip"><svg fill="none" height="12" viewBox="0 0 24 24" width="12"><rect height="12" rx="2.5" stroke="var(--crimson-deep)" strokeWidth="1.7" width="19" x="2.5" y="6"></rect><path d="M2.5 10h19" stroke="var(--crimson-deep)" strokeWidth="1.7"></path></svg>pay</span>
</div>
<div className="field-row" style={{flexDirection: "column", alignItems: "stretch", gap: "10px"}}>
<span style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}><span className="field-k">Per-transaction cap</span><span className="field-v">$50.00</span></span>
<div className="slider-track"><div className="slider-fill" style={{width: "33%"}}></div><div className="slider-knob" style={{left: "33%"}}></div></div>
</div>
<div className="field-row">
<span className="field-k">Billing period</span>
<span className="field-v">30 days</span>
</div>
<div className="field-row">
<span className="field-k">Step-up above</span>
<span style={{display: "flex", alignItems: "center", gap: "9px"}}><span className="field-v" style={{color: "var(--ink)"}}>$100.00</span><span className="toggle-on"></span></span>
</div>
<div className="field-row">
<span className="field-k">Expires</span>
<span className="field-v mono" style={{fontSize: "12.5px"}}>2026-12-31</span>
</div>
</div>
</div>
</div>
</div>
</section>
{/* ==================== COMPARISON ==================== */}
<section className="aeg-section aeg-wrap">
<div className="eyebrow">
<span className="eyebrow-num">06</span><span className="eyebrow-label">Why AgentTag</span>
</div>
<h2 className="display" style={{margin: "0 0 16px", fontSize: "clamp(33px, 4.6vw, 54px)", lineHeight: "1.05"}}>Built for <span className="accent-it">delegation.</span></h2>
<p style={{maxWidth: "520px", margin: "0 0 44px", fontSize: "17px", lineHeight: "1.65", color: "var(--muted)"}}>Password managers share secrets. DIY scripts skip governance. AgentTag is identity-first, MCP-native, and accountable by construction.</p>
<div className="card term-scroll scroll-hint card-spotlight" style={{padding: "0", overflowX: "auto", position: "relative"}}>
<table className="cmp" style={{minWidth: "720px"}}>
<colgroup>
<col style={{width: "32%"}}/>
<col style={{width: "17%"}}/>
<col style={{width: "17%"}}/>
<col style={{width: "17%"}}/>
<col style={{width: "17%"}}/>
</colgroup>
<thead>
<tr>
<th>Cryptographic agent<br/>identity &amp; delegation</th>
<th>
<div className="cmp-logo-wrap">
<svg className="cmp-logo-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><rect height="12" rx="2" stroke="currentColor" strokeDasharray="3 2" width="12" x="3" y="3"></rect><rect fill="currentColor" fillOpacity="0.15" height="12" rx="2" stroke="currentColor" width="12" x="9" y="9"></rect></svg>
<span className="cmp-logo-text">AliasKit</span>
</div>
</th>
<th>
<div className="cmp-logo-wrap">
<svg className="cmp-logo-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12h3l3-9 4 18 3-12 2 3h3"></path></svg>
<span className="cmp-logo-text">anima</span>
</div>
</th>
<th>
<div className="cmp-logo-wrap">
<svg className="cmp-logo-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><rect height="14" rx="3" width="18" x="3" y="5"></rect><line x1="3" x2="21" y1="10" y2="10"></line><rect fill="currentColor" height="1" width="3" x="7" y="14"></rect></svg>
<span className="cmp-logo-text">AgentWallet</span>
</div>
</th>
<th className="col-highlight">
<div className="cmp-logo-wrap">
<svg className="cmp-logo-icon" fill="none" style={{stroke: "var(--crimson)", fill: "rgba(169, 27, 44, 0.08)", strokeWidth: "1.6"}} viewBox="0 0 24 24"><rect height="19" rx="5.5" stroke="var(--crimson)" width="19" x="2.5" y="2.5"></rect><rect fill="var(--crimson)" height="4" rx="1.2" width="4" x="6" y="6"></rect><rect fill="var(--crimson)" height="4" opacity="0.4" rx="1.2" width="4" x="14" y="6"></rect><rect fill="var(--crimson)" height="4" opacity="0.4" rx="1.2" width="4" x="6" y="14"></rect><rect fill="var(--crimson)" height="4" rx="1.2" width="4" x="14" y="14"></rect></svg>
<span className="cmp-logo-text">AgentTag</span>
</div>
</th>
</tr>
</thead>
<tbody>
<tr>
<td>DID-anchored agent passports</td>
<td><div className="cell-mark cell-no">✕</div></td>
<td><div className="cell-mark cell-no">✕</div></td>
<td><div className="cell-mark cell-no">✕</div></td>
<td className="col-highlight"><div className="cell-mark cell-yes">✓</div></td>
</tr>
<tr>
<td>Cryptographic, attenuable mandates</td>
<td><div className="cell-mark cell-no">✕</div></td>
<td><div className="cell-mark cell-no">✕</div></td>
<td><div className="cell-mark cell-no">✕</div></td>
<td className="col-highlight"><div className="cell-mark cell-yes">✓</div></td>
</tr>
<tr>
<td>Real-world primitives (pay, comms)</td>
<td><div className="cell-mark cell-yes">✓</div></td>
<td><div className="cell-mark cell-yes">✓</div></td>
<td><div className="cell-mark cell-yes">✓</div></td>
<td className="col-highlight"><div className="cell-mark cell-yes">✓</div></td>
</tr>
<tr>
<td>On-device passkey approvals</td>
<td><div className="cell-mark cell-no">✕</div></td>
<td><div className="cell-mark cell-no">✕</div></td>
<td><div className="cell-mark cell-no">✕</div></td>
<td className="col-highlight"><div className="cell-mark cell-yes">✓</div></td>
</tr>
<tr>
<td>Hash-chained, offline-verifiable ledger</td>
<td><div className="cell-mark cell-no">✕</div></td>
<td><div className="cell-mark cell-no">✕</div></td>
<td><div className="cell-mark cell-no">✕</div></td>
<td className="col-highlight"><div className="cell-mark cell-yes">✓</div></td>
</tr>
</tbody>
</table>
</div>
</section>
{/* ==================== PRICING ==================== */}
<section className="aeg-section aeg-wrap" id="pricing">
<div className="eyebrow">
<span className="eyebrow-num">07</span><span className="eyebrow-label">Pricing</span>
</div>
<h2 className="display" style={{margin: "0 0 16px", fontSize: "clamp(33px, 4.6vw, 54px)", lineHeight: "1.05"}}>Free while we’re <span className="accent-it">in beta.</span></h2>
<p style={{maxWidth: "560px", margin: "0 0 38px", fontSize: "17px", lineHeight: "1.65", color: "var(--muted)"}}>All primitives, policy, and the hash‑chained ledger are unlocked for public beta. No card. No seats. No hidden catch.</p>
<div className="price-grid" style={{display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: "18px", alignItems: "stretch"}}>
{/* Beta access - primary */}
<div className="card price-pop card-spotlight" style={{padding: "44px 36px 36px", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lift)"}}>
<div className="price-top-bar"></div>
<div className="price-badge">Public beta</div>
<div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
<span style={{fontWeight: "600", fontSize: "16px", color: "var(--ink)"}}>Live now</span>
</div>
<div style={{margin: "16px 0 4px", display: "flex", alignItems: "baseline", gap: "10px"}}>
<span className="display" style={{fontSize: "56px", lineHeight: "1"}}>$0</span>
<span style={{fontSize: "15px", color: "var(--faint)"}}>for everyone, right now</span>
</div>
<p style={{margin: "8px 0 24px", fontSize: "14px", lineHeight: "1.55", color: "var(--muted)"}}>Bring your first agent online and govern it end to end.</p>
<div className="hairline" style={{marginBottom: "22px"}}></div>
<ul className="beta-feats" style={{listStyle: "none", margin: "0 0 28px", padding: "0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 22px", flex: "1"}}>
<li style={{display: "flex", gap: "10px", fontSize: "14px", color: "var(--muted)", lineHeight: "1.5"}}><span style={{flex: "none", marginTop: "1px"}}><svg fill="none" height="15" viewBox="0 0 24 24" width="15"><path d="M5 12.5l4 4 10-10.5" stroke="var(--crimson)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></span><span>All five primitives, live</span></li>
<li style={{display: "flex", gap: "10px", fontSize: "14px", color: "var(--muted)", lineHeight: "1.5"}}><span style={{flex: "none", marginTop: "1px"}}><svg fill="none" height="15" viewBox="0 0 24 24" width="15"><path d="M5 12.5l4 4 10-10.5" stroke="var(--crimson)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></span><span>Multiple agent passports</span></li>
<li style={{display: "flex", gap: "10px", fontSize: "14px", color: "var(--muted)", lineHeight: "1.5"}}><span style={{flex: "none", marginTop: "1px"}}><svg fill="none" height="15" viewBox="0 0 24 24" width="15"><path d="M5 12.5l4 4 10-10.5" stroke="var(--crimson)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></span><span>Full policy engine and step-up</span></li>
<li style={{display: "flex", gap: "10px", fontSize: "14px", color: "var(--muted)", lineHeight: "1.5"}}><span style={{flex: "none", marginTop: "1px"}}><svg fill="none" height="15" viewBox="0 0 24 24" width="15"><path d="M5 12.5l4 4 10-10.5" stroke="var(--crimson)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></span><span>Passkey approvals on-device</span></li>
<li style={{display: "flex", gap: "10px", fontSize: "14px", color: "var(--muted)", lineHeight: "1.5"}}><span style={{flex: "none", marginTop: "1px"}}><svg fill="none" height="15" viewBox="0 0 24 24" width="15"><path d="M5 12.5l4 4 10-10.5" stroke="var(--crimson)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></span><span>Hash-chained audit ledger</span></li>
<li style={{display: "flex", gap: "10px", fontSize: "14px", color: "var(--muted)", lineHeight: "1.5"}}><span style={{flex: "none", marginTop: "1px"}}><svg fill="none" height="15" viewBox="0 0 24 24" width="15"><path d="M5 12.5l4 4 10-10.5" stroke="var(--crimson)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></span><span>Direct line to the founders</span></li>
</ul>
<a className="btn btn-crimson btn-cta-new" href="#/app/dashboard" style={{justifyContent: "center"}}>Get beta access</a>
<p style={{margin: "14px 0 0", textAlign: "center", fontSize: "12.5px", color: "var(--faint)"}}>No credit card. Cancel anytime. Your data stays yours.</p>
</div>
{/* What happens at GA */}
<div className="card card-spotlight" style={{padding: "36px", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, var(--surface), var(--paper-2))"}}>
<div style={{fontWeight: "600", fontSize: "16px", color: "var(--ink)"}}>Fair usage-based pricing</div>
<p style={{margin: "8px 0 24px", fontSize: "14px", lineHeight: "1.55", color: "var(--muted)"}}>When we reach general availability, you’ll pay for autonomy, not seats.</p>
<div className="hairline" style={{marginBottom: "22px"}}></div>
<ul style={{listStyle: "none", margin: "0 0 28px", padding: "0", display: "flex", flexDirection: "column", gap: "14px", flex: "1"}}>
<li style={{display: "flex", gap: "10px", fontSize: "14px", color: "var(--muted)", lineHeight: "1.5"}}><span style={{flex: "none", marginTop: "1px"}}><svg fill="none" height="15" viewBox="0 0 24 24" width="15"><path d="M5 12.5l4 4 10-10.5" stroke="var(--crimson)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></span><span><b>30 days’</b> notice before any new plan starts</span></li>
<li style={{display: "flex", gap: "10px", fontSize: "14px", color: "var(--muted)", lineHeight: "1.5"}}><span style={{flex: "none", marginTop: "1px"}}><svg fill="none" height="15" viewBox="0 0 24 24" width="15"><path d="M5 12.5l4 4 10-10.5" stroke="var(--crimson)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></span><span>A generous free tier that stays free</span></li>
<li style={{display: "flex", gap: "10px", fontSize: "14px", color: "var(--muted)", lineHeight: "1.5"}}><span style={{flex: "none", marginTop: "1px"}}><svg fill="none" height="15" viewBox="0 0 24 24" width="15"><path d="M5 12.5l4 4 10-10.5" stroke="var(--crimson)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></span><span>Founding-user pricing locked in</span></li>
<li style={{display: "flex", gap: "10px", fontSize: "14px", color: "var(--muted)", lineHeight: "1.5"}}><span style={{flex: "none", marginTop: "1px"}}><svg fill="none" height="15" viewBox="0 0 24 24" width="15"><path d="M5 12.5l4 4 10-10.5" stroke="var(--crimson)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></span><span>Enterprise SSO, SLA, and on-prem support when needed</span></li>
</ul>
<a className="btn btn-ghost" href="#cta" style={{justifyContent: "center"}}>Talk to the team</a>
</div>
</div>
</section>
{/* ==================== SUPPORT HUB TEASER ==================== */}
<section className="aeg-section aeg-wrap" id="faq">
<div className="eyebrow"><span className="eyebrow-num">07</span><span className="eyebrow-label">Support</span></div>
<h2 className="display" style={{margin: "0 0 14px", fontSize: "clamp(33px, 4.6vw, 54px)", lineHeight: "1.05"}}>Questions, <span className="accent-it">answered.</span></h2>
<p style={{maxWidth: "560px", margin: "0 0 40px", fontSize: "17px", lineHeight: "1.65", color: "var(--muted)"}}>Everything you need to know about giving an agent its own governed identity — plus live channels to the team.</p>

{/* Teaser card linking to the dedicated Support Center */}
<a className="support-teaser-card card-spotlight" href="#/support">
  <div className="support-teaser-icon">
    <svg fill="none" height="28" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24" width="28"><circle cx="12" cy="12" r="10"></circle><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2.5-3 4"></path><path d="M12 17h.01"></path></svg>
  </div>
  <div className="support-teaser-body">
    <div className="support-teaser-eyebrow">Support Center</div>
    <h3 className="support-teaser-title">Browse the full knowledge base</h3>
    <p className="support-teaser-desc">
      Search 12 articles across Fundamentals, Getting started, Integrations, Security, and Billing —
      or reach a human on email, Discord, or GitHub.
    </p>
    <div className="support-teaser-meta">
      <span className="support-teaser-chip"><span className="support-teaser-dot"></span>All systems operational</span>
      <span className="support-teaser-divider"></span>
      <span>Avg. response &lt; 6h</span>
    </div>
  </div>
  <div className="support-teaser-cta">
    <span>Open Support Center</span>
    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><line x1="5" x2="19" y1="12" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
  </div>
</a>
</section>
{/* ==================== CTA ==================== */}
<section className="aeg-section aeg-wrap cta-section-new" id="cta">
{/* Pixel Grid Background Fade */}
<div className="cta-pixel-grid"></div>
{/* Center Content */}
<div className="cta-content-wrapper">
<div className="cta-kicker">[ get started ]</div>
<h2 className="display cta-title">
        Give your agent <span className="cta-dashed-highlight">a passport.</span>
</h2>
<p className="cta-desc">
        Bring your first agent online with governed identity, signed permissions, and a verifiable audit trail.
      </p>
<form className="cta-form-new" onSubmit={onSubmit}>
<input aria-label="Email address" className="cta-input-new" id="cta-email" name="email" placeholder="you@company.com" required type="email"/>
<button className="btn btn-crimson btn-cta-new" type="submit" onClick={() => { setTimeout(() => { window.location.hash = '/app/dashboard'; }, 400); }}>Get beta access</button>
</form>
<p className="cta-footer-note">The human stays accountable. The agent gets its own identity.</p>
</div>
</section>
{/* ==================== FOOTER ==================== */}
<footer className="aeg-footer" aria-label="Site footer">
<div className="aeg-wrap">
{/* Top Brand &amp; Newsletter row */}
<div className="footer-top-row">
<div className="footer-brand-col">
<div style={{display: "flex", alignItems: "center", gap: "10px"}}>
  <img src={theme === 'dark' ? "/logo_bgremoved_inverted.png" : "/logo_bgremoved.png"} alt="AgentTag" height="24" style={{ height: "24px", width: "auto" }} />
<span style={{fontWeight: "800", fontSize: "20px", letterSpacing: "-0.3px", color: "var(--ink)", textTransform: "uppercase", fontFamily: "'Bricolage Grotesque', sans-serif"}}>AgentTag</span>
</div>
<p className="footer-brand-tagline">The control plane for delegated agent identity. Your agent, its own passport.</p>
</div>
<div className="footer-newsletter-col">
<div className="footer-newsletter-label">Subscribe to our newsletter</div>
<form className="footer-newsletter-form" onSubmit={onSubmit}>
<div className="footer-newsletter-input-wrapper">
<svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" style={{marginRight: "10px", opacity: "0.6", flexShrink: "0"}} viewBox="0 0 24 24" width="16"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
<input className="footer-newsletter-input" name="email" placeholder="Enter your email" required type="email" aria-label="Email for newsletter"/>
<button aria-label="Subscribe" className="footer-newsletter-btn" type="submit">
<svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="14"><line x1="5" x2="19" y1="12" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
</button>
</div>
</form>
<div className="footer-newsletter-terms">By subscribing you agree to our terms.</div>
</div>
</div>
{/* Middle columns row */}
<div className="footer-columns-row">
<div>
<div className="footer-col-title">Links</div>
<a className="footer-link" href="#top">Home</a>
<a className="footer-link" href="#how">Platform</a>
<a className="footer-link" href="#pricing">Pricing</a>
<a className="footer-link" href="#surface">Docs</a>
<a className="footer-link" href="mailto:careers@agenttag.ai">Careers</a>
<a className="footer-link" href="mailto:hello@agenttag.ai">Contact us</a>
</div>
<div>
<div className="footer-col-title">Platform</div>
<a className="footer-link" href="#primitives">Platform</a>
<a className="footer-link" href="#surface">MCP Surface</a>
<a className="footer-link" href="#policy">Policy Engine</a>
<a className="footer-link" href="#ledger">Audit Ledger</a>
<a className="footer-link" href="#pricing">Why AgentTag?</a>
</div>
<div>
<div className="footer-col-title">Resources</div>
<a className="footer-link" href="#/case-studies">Case Studies</a>
<a className="footer-link" href="#/blog">Blog & Insights</a>
<a className="footer-link" href="#/research">Research</a>
<a className="footer-link" href="#/support">FAQ</a>
<a className="footer-link" href="https://status.agenttag.ai" target="_blank" rel="noopener noreferrer">Status</a>
</div>
<div>
<div className="footer-col-title">Socials</div>
<a className="footer-link" href="https://github.com/agenttag" target="_blank" rel="noopener noreferrer">GitHub</a>
<a className="footer-link" href="https://discord.gg/agenttag" target="_blank" rel="noopener noreferrer">Discord</a>
<a className="footer-link" href="https://x.com/agenttag" target="_blank" rel="noopener noreferrer">X (Formerly Twitter)</a>
</div>
</div>
{/* Standards / security posture — honest protocol credibility, no fabricated logos */}
<div className="footer-standards">
<span className="footer-standards-label">Built to standards</span>
<div className="footer-standards-badges">
<span className="footer-standards-badge">Ed25519</span>
<span className="footer-standards-badge">W3C DID</span>
<span className="footer-standards-badge">WebAuthn · Passkeys</span>
<span className="footer-standards-badge">MCP-native</span>
<span className="footer-standards-badge">SOC&nbsp;2 · in progress</span>
</div>
</div>
<div className="footer-divider"></div>
{/* Bottom copyright row */}
<div className="footer-bottom-row">
<div className="footer-copyright">© Copyright 2026 AgentTag.ai</div>
<div className="footer-legal-links">
<a className="footer-legal-link" href="#/terms">Terms of Service</a>
<a className="footer-legal-link" href="#/privacy">Privacy Policy</a>
<a className="footer-legal-link" href="#/data-tos">Data Platform TOS</a>
</div>
</div>
{/* Watermark background text */}
<div className="footer-watermark">AgentTag</div>
</div>
</footer>
      <div className="progressive-blur-bottom" aria-hidden="true" />
    </div>
</div>

    </MotionConfig>
  )
}

export default App
