import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Key, RefreshCw, Cpu, Globe, Mail, Phone, CreditCard, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface SystemCounterProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export interface PrimitiveCardProps {
  num: string;
  title: string;
  description: string;
  command: string;
  icon: React.ReactNode;
}

export type Verdict = 'ALLOW' | 'STEP_UP' | 'NOTICE' | 'DENY';

export interface LedgerEntry {
  sequence: number;
  eventType: 'policy' | 'action' | 'approval' | 'cred_use';
  action: string;
  verdict: Verdict;
  timestamp: string;
  hash: string;
}

// ==========================================
// MOCK DATA & SIMULATION POOL
// ==========================================

const MOCK_LEDGER_POOL: Omit<LedgerEntry, 'sequence' | 'timestamp' | 'hash'>[] = [
  { eventType: 'policy', action: 'pay $5.00 → vercel · saas mandate', verdict: 'ALLOW' },
  { eventType: 'action', action: 'deploy thing.agents.host (firecracker microVM)', verdict: 'NOTICE' },
  { eventType: 'cred_use', action: 'vault.use → github_agent_oauth_key', verdict: 'ALLOW' },
  { eventType: 'policy', action: 'browse linear.app/signup · session inject', verdict: 'ALLOW' },
  { eventType: 'action', action: 'provision phone_number (SMS 2FA check)', verdict: 'ALLOW' },
  { eventType: 'policy', action: 'pay $840.00 → acme_data · unmapped merchant', verdict: 'STEP_UP' },
  { eventType: 'approval', action: 'operator_sign_envelope (secp256k1 signature confirmed)', verdict: 'ALLOW' },
  { eventType: 'policy', action: 'transfer 5.0 ETH → unknown_deposit_contract', verdict: 'DENY' },
  { eventType: 'cred_use', action: 'vault.use → twilio_api_credentials', verdict: 'ALLOW' },
  { eventType: 'action', action: 'comms.verify (extracted OTP: 502-938)', verdict: 'ALLOW' },
];

// ==========================================
// SUB-COMPONENTS
// ==========================================

// 1. System Counter Component
const SystemCounter: React.FC<SystemCounterProps> = ({ label, value, icon }) => (
  <div className="flex flex-col justify-between p-6 border-b border-r border-[#0b132b]/5 bg-white/40 backdrop-blur-sm relative overflow-hidden group">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold tracking-wider text-[#0b132b]/40 uppercase font-mono">{label}</span>
      <span className="text-[#bf6a2e]/70 group-hover:text-[#bf6a2e] transition-colors duration-300">{icon}</span>
    </div>
    <div className="mt-4 flex items-baseline">
      <span className="text-3xl font-bold tracking-tight text-[#0b132b] font-mono leading-none">{value}</span>
    </div>
  </div>
);

// 2. Translucent Syntax Pane Component
const SyntaxPane: React.FC<{ command: string }> = ({ command }) => (
  <div className="mt-4 p-3 bg-[#0b132b]/[0.02] border border-[#0b132b]/[0.06] rounded-lg font-mono text-[11px] text-[#0b132b]/60 relative overflow-hidden">
    <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] pointer-events-none" />
    <span className="relative z-10 block whitespace-nowrap overflow-x-auto scrollbar-none">
      <span className="text-[#bf6a2e] font-semibold">execute</span> {command}
    </span>
  </div>
);

// 3. Primitives Bento Card Component
const PrimitiveCard: React.FC<PrimitiveCardProps> = ({ num, title, description, command, icon }) => (
  <motion.div
    whileHover={{ y: -6 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="flex flex-col justify-between p-6 bg-white/60 border border-[#0b132b]/5 rounded-xl shadow-[0_1px_2px_rgba(11,19,43,0.02)] relative overflow-hidden group hover:border-[#bf6a2e]/20 hover:shadow-[0_16px_36px_-16px_rgba(191,106,46,0.08)] transition-shadow duration-300 h-full"
  >
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="w-9 h-9 rounded-lg bg-[#bf6a2e]/5 border border-[#bf6a2e]/10 flex items-center justify-center text-[#bf6a2e] group-hover:scale-105 transition-transform duration-300">
          {icon}
        </div>
        <span className="text-[10px] font-bold tracking-wider text-[#bf6a2e] bg-[#bf6a2e]/5 border border-[#bf6a2e]/15 px-2 py-0.5 rounded font-mono">{num}</span>
      </div>
      <h4 className="text-sm font-bold text-[#0b132b] tracking-tight">{title}</h4>
      <p className="mt-1 text-xs text-[#0b132b]/60 leading-relaxed font-sans">{description}</p>
    </div>
    <SyntaxPane command={command} />
  </motion.div>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

export const AgentGridDashboard: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [seqCounter, setSeqCounter] = useState(4082);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Interactive Background Dots Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    
    // Mouse coordinates in canvas space
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0, active: false, easeActive: 0 };
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };
    
    const handleMouseLeave = () => {
      mouse.active = false;
    };
    
    const handleMouseEnter = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      if (!mouse.active) {
        mouse.x = mouse.targetX;
        mouse.y = mouse.targetY;
      }
      mouse.active = true;
    };
    
    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect() || canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    
    const wrapper = canvas.parentElement || document.body;
    wrapper.addEventListener('mousemove', handleMouseMove as any);
    wrapper.addEventListener('mouseleave', handleMouseLeave);
    wrapper.addEventListener('mouseenter', handleMouseEnter as any);
    window.addEventListener('resize', handleResize);
    
    handleResize();
    
    mouse.x = mouse.targetX = width / 2 || window.innerWidth / 2;
    mouse.y = mouse.targetY = height / 2 || 300;
    
    let animId: number;
    const spacing = 6;
    const radius = 400;
    const baseDotOpacity = 0.05;
    const colorPrefix = 'rgba(191, 106, 46, '; // warm copper
    
    const draw = () => {
      if (!ctx) return;
      
      // Auto-retry resizing if layout wasn't complete on initial mount
      if (width === 0 || height === 0) {
        handleResize();
      }
      
      // Interpolate mouse coordinates (instant follow response)
      mouse.x += (mouse.targetX - mouse.x) * 0.85;
      mouse.y += (mouse.targetY - mouse.y) * 0.85;
      mouse.easeActive += ((mouse.active ? 1 : 0) - mouse.easeActive) * 0.16;
      
      ctx.clearRect(0, 0, width, height);
      
      const cols = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);
      const cx = width / 2;
      const cy = height / 2;
      
      // ==================== PASS 1: BATCH DRAW ALL BASE GRID DOTS (EXTREMELY FAST) ====================
      ctx.beginPath();
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const x0 = c * spacing;
          const y0 = r * spacing;
          
          const vigX = Math.max(0, 1 - Math.abs(x0 - cx) / (width * 0.495));
          const vigY = Math.max(0, 1 - Math.abs(y0 - cy) / (height * 0.495));
          const vignette = Math.pow(vigX * vigY, 0.5);
          
          if (vignette <= 0.01) continue;
          
          ctx.moveTo(x0 + 0.3, y0);
          ctx.arc(x0, y0, 0.3, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = colorPrefix + baseDotOpacity + ')';
      ctx.fill();
      
      // ==================== PASS 2: DRAW OVERLAY FOR LIGHTED/ACTIVE DOTS (SPATIAL BOUNDED) ====================
      if (mouse.easeActive > 0.01) {
        const time = Date.now() * 0.0035;
        const activeRadius = radius * (1.2 * mouse.easeActive);
        
        const minCol = Math.max(0, Math.floor((mouse.x - activeRadius) / spacing));
        const maxCol = Math.min(cols, Math.ceil((mouse.x + activeRadius) / spacing));
        const minRow = Math.max(0, Math.floor((mouse.y - activeRadius) / spacing));
        const maxRow = Math.min(rows, Math.ceil((mouse.y + activeRadius) / spacing));
        
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            const x0 = c * spacing;
            const y0 = r * spacing;
            
            const vigX = Math.max(0, 1 - Math.abs(x0 - cx) / (width * 0.495));
            const vigY = Math.max(0, 1 - Math.abs(y0 - cy) / (height * 0.495));
            const vignette = Math.pow(vigX * vigY, 0.5);
            
            if (vignette <= 0.01) continue;
            
            const dx = mouse.x - x0;
            const dy = mouse.y - y0;
            const distSq = dx * dx + dy * dy;
            
            const angle = Math.atan2(dy, dx);
            const wobble = Math.sin(angle * 4.5 + time) * 0.15 + Math.cos(angle * 2.5 - time * 0.8) * 0.1;
            const dynamicRadius = radius * (1.0 + wobble * mouse.easeActive);
            
            if (distSq < dynamicRadius * dynamicRadius) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / dynamicRadius) * mouse.easeActive;
              
              const finalRadius = 0.3 + force * 0.85; // scales up to 1.15px max under spotlight (keeps dots small)
              const opacity = baseDotOpacity + force * 0.66;
              
              const finalOpacity = opacity * vignette;
              if (finalOpacity <= 0.005) continue;
              
              ctx.beginPath();
              ctx.arc(x0, y0, finalRadius, 0, Math.PI * 2);
              ctx.fillStyle = colorPrefix + finalOpacity + ')';
              ctx.fill();
            }
          }
        }
      }
      
      animId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animId);
      wrapper.removeEventListener('mousemove', handleMouseMove as any);
      wrapper.removeEventListener('mouseleave', handleMouseLeave);
      wrapper.removeEventListener('mouseenter', handleMouseEnter as any);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Generate Initial Ledger Feed
  useEffect(() => {
    const initialList: LedgerEntry[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const idx = 5 - i;
      const t = new Date(now.getTime() - idx * 45000);
      initialList.push({
        sequence: seqCounter - idx,
        eventType: MOCK_LEDGER_POOL[idx].eventType as LedgerEntry['eventType'],
        action: MOCK_LEDGER_POOL[idx].action,
        verdict: MOCK_LEDGER_POOL[idx].verdict as Verdict,
        timestamp: t.toLocaleTimeString(),
        hash: '0x' + Math.floor(Math.random() * 0xffffffff).toString(16).slice(0, 6) + '…',
      });
    }
    setLedger(initialList);
  }, []);

  // Simulate Live Feed updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSeqCounter((prev) => {
        const nextSeq = prev + 1;
        const poolItem = MOCK_LEDGER_POOL[nextSeq % MOCK_LEDGER_POOL.length];
        const newEntry: LedgerEntry = {
          sequence: nextSeq,
          eventType: poolItem.eventType as LedgerEntry['eventType'],
          action: poolItem.action,
          verdict: poolItem.verdict as Verdict,
          timestamp: new Date().toLocaleTimeString(),
          hash: '0x' + Math.floor(Math.random() * 0xffffffff).toString(16).slice(0, 6) + '…',
        };
        setLedger((prevList) => [newEntry, ...prevList.slice(0, 6)]);
        return nextSeq;
      });
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install -g @agentgrid/cli');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getVerdictStyle = (v: Verdict) => {
    switch (v) {
      case 'ALLOW':
        return 'text-[#10b981] bg-[#10b981]/5 border-[#10b981]/15';
      case 'STEP_UP':
        return 'text-[#f59e0b] bg-[#f59e0b]/5 border-[#f59e0b]/15';
      case 'NOTICE':
        return 'text-[#3b82f6] bg-[#3b82f6]/5 border-[#3b82f6]/15';
      case 'DENY':
        return 'text-[#ef4444] bg-[#ef4444]/5 border-[#ef4444]/15';
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-[#0b132b] flex flex-col font-sans select-none antialiased relative overflow-hidden">
      {/* Dynamic Background Noise Texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.8)_0%,_transparent_100%)] bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      {/* Interactive Dots Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-16 flex flex-col gap-16 relative z-10">
        
        {/* ==========================================
            1. OVERVIEW HERO SECTION (CENTERED)
            ========================================== */}
        <section className="flex flex-col items-center text-center gap-8 max-w-3xl mx-auto w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-[#bf6a2e] font-mono text-xs font-semibold uppercase tracking-wider bg-[#bf6a2e]/5 border border-[#bf6a2e]/10 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#bf6a2e] animate-pulse" />
              Control Plane v1.0.4-beta
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-serif text-[#0b132b] leading-[1.05] max-w-2xl">
              Identity for AI agents.<br />
              <span className="text-[#bf6a2e]">Not yours — theirs.</span>
            </h1>
            <p className="text-sm md:text-base text-[#0b132b]/60 max-w-lg mt-2">
              Provision cryptographic DID credentials, sandbox phone endpoints, SaaS spend boundaries, and isolated Firecracker microVMs dynamically.
            </p>
          </div>
          
          {/* Terminal Input Box */}
          <div className="w-full max-w-sm flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-[#0b132b]/40 tracking-wider uppercase font-mono">Global Agent CLI Installer</span>
            <div className="flex items-center justify-between gap-3 bg-[#0b132b]/[0.03] border border-[#0b132b]/[0.08] rounded-xl px-4 py-3 font-mono text-xs text-[#0b132b] relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] pointer-events-none" />
              <div className="flex items-center gap-2 relative z-10">
                <Terminal size={14} className="text-[#bf6a2e]" />
                <span>npm install -g @agentgrid/cli</span>
              </div>
              <button 
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-[#0b132b]/5 text-[#0b132b]/50 hover:text-[#0b132b] transition-all relative z-10"
                aria-label="Copy installation command"
              >
                {copied ? <Check size={14} className="text-[#10b981]" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </section>

        {/* System Counters (Locked Grid) */}
        <section className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 border border-[#0b132b]/5 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-md shadow-[0_1px_3px_rgba(11,19,43,0.02)]">
            <SystemCounter label="Primitives Active" value="05" icon={<Cpu size={16} />} />
            <SystemCounter label="Secrets Leaked" value="00" icon={<Shield size={16} />} />
            <SystemCounter label="Verdicts Certified" value={seqCounter - 3036} icon={<RefreshCw size={16} />} />
            <SystemCounter label="Revocation Key" value="01" icon={<Key size={16} />} />
          </div>
        </section>

        {/* ==========================================
            2. CRYPTOGRAPHIC PASSPORT CARD (CENTERED FOCAL POINT)
            ========================================== */}
        <section className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
          <span className="text-[10px] font-semibold text-[#0b132b]/40 tracking-wider uppercase font-mono">Active Cryptographic Passport</span>
          
          <div className="w-full relative overflow-hidden rounded-2xl border border-transparent bg-gradient-to-br from-white to-[#fcfbf7] p-8 shadow-[0_30px_60px_-24px_rgba(11,19,75,0.06),_0_1px_0_rgba(255,255,255,0.85)_inset,_0_0_0_1px_rgba(11,19,43,0.02)] before:absolute before:inset-0 before:pointer-events-none before:border before:border-transparent before:bg-gradient-to-br before:from-white/70 before:to-[#bf6a2e]/10 before:rounded-2xl before:mask-composite">
            {/* Subtle top light-bleed effect */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#bf6a2e]/30 to-transparent" />
            
            {/* Header banner */}
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold tracking-widest text-[#bf6a2e] uppercase font-mono">AGENTPASSPORT</span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#10b981] bg-[#10b981]/5 border border-[#10b981]/15 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                ACTIVE
              </span>
            </div>

            {/* Sigil & DID info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0b132b] to-[#1d2d5f] flex items-center justify-center shadow-[0_4px_12px_rgba(11,19,43,0.15)]">
                <div className="grid grid-cols-2 gap-1 w-5 h-5">
                  <span className="bg-[#bf6a2e] rounded-sm" />
                  <span className="bg-white/40 rounded-sm" />
                  <span className="bg-white/40 rounded-sm" />
                  <span className="bg-[#bf6a2e] rounded-sm" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0b132b] tracking-tight">Research Agent</h3>
                <span className="text-xs text-[#0b132b]/55 font-mono">did:key:z6Mk…AGENT</span>
              </div>
            </div>

            {/* Passport grid metadata */}
            <div className="grid grid-cols-2 gap-px bg-[#0b132b]/[0.06] border border-[#0b132b]/[0.06] rounded-xl overflow-hidden text-xs">
              <div className="bg-white/60 p-3">
                <span className="block text-[9px] font-bold tracking-wider text-[#bf6a2e] uppercase mb-0.5 font-mono">Operator</span>
                <span className="text-[#0b132b]/80 font-mono overflow-hidden text-ellipsis block whitespace-nowrap">did:key:z6Mk…HUMAN</span>
              </div>
              <div className="bg-white/60 p-3">
                <span className="block text-[9px] font-bold tracking-wider text-[#bf6a2e] uppercase mb-0.5 font-mono">Signing key</span>
                <span className="text-[#0b132b]/80 font-mono">Ed25519</span>
              </div>
              <div className="bg-white/60 p-3 col-span-2">
                <span className="block text-[9px] font-bold tracking-wider text-[#bf6a2e] uppercase mb-0.5 font-mono">Scope limits</span>
                <span className="text-[#0b132b]/80 font-sans">SaaS Mandates &middot; &le; $100.00/mo limit</span>
              </div>
            </div>

            {/* Operator signature stamp */}
            <div className="mt-6 pt-4 border-t border-dashed border-[#0b132b]/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-[#0b132b]/50">
                <Shield size={12} className="text-[#bf6a2e]" />
                <span>Revocable with a single master key</span>
              </div>
              <span className="font-serif font-black text-sm text-[#bf6a2e]/60 tracking-tight">AgentGrid</span>
            </div>
          </div>
        </section>

        {/* ==========================================
            3. THE FIVE PRIMITIVES BENTO GRID
            ========================================== */}
        <section className="flex flex-col gap-3 w-full">
          <span className="text-[10px] font-semibold text-[#0b132b]/40 tracking-wider uppercase font-mono">System Capabilities Bento Grid</span>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Top Row: Browser (4 cols) */}
            <div className="md:col-span-4">
              <PrimitiveCard 
                num="01" 
                title="Browser" 
                description="Headful Playwright driver. Injects OAuth state directly without exposing private keys to agent script."
                command="browse(action, target)"
                icon={<Globe size={18} />}
              />
            </div>

            {/* Top Row: Email (4 cols) */}
            <div className="md:col-span-4">
              <PrimitiveCard 
                num="02" 
                title="Email" 
                description="Custom sandbox mail inbox. Intercepts and parses OTP / Magic-Link tokens dynamically."
                command="comms.verify(sess)"
                icon={<Mail size={18} />}
              />
            </div>

            {/* Top Row: Phone (4 cols) */}
            <div className="md:col-span-4">
              <PrimitiveCard 
                num="03" 
                title="Phone" 
                description="Dedicated Twilio API endpoint. Intercepts SMS 2FA checkpoints and automatically updates status."
                command="provision('number')"
                icon={<Phone size={18} />}
              />
            </div>

            {/* Bottom Row Asymmetric: Money (5 cols - 41.6%) */}
            <div className="md:col-span-5">
              <PrimitiveCard 
                num="04" 
                title="Money" 
                description="Enforces cryptographic spending limits via Lithic. Automatically blocks transactions exceeding the signed mandate."
                command="pay(amount, merchant, card?)"
                icon={<CreditCard size={18} />}
              />
            </div>

            {/* Bottom Row Asymmetric: Compute (7 cols - 58.3%) */}
            <div className="md:col-span-7">
              <PrimitiveCard 
                num="05" 
                title="Compute" 
                description="Provision sandboxed Linux kernel Firecracker microVMs dynamically. Integrates network isolation mandates securely."
                command="deploy(project, files, env)"
                icon={<Cpu size={18} />}
              />
            </div>
            
          </div>
        </section>

        {/* ==========================================
            4. TAMPER-EVIDENT AUDIT LEDGER (LIVE FEED Component)
            ========================================== */}
        <section className="flex flex-col gap-3 w-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#0b132b]/40 tracking-wider uppercase font-mono">Tamper-Evident Audit Log Ledger</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#10b981] bg-[#10b981]/5 px-2 py-0.5 border border-[#10b981]/15 rounded font-mono font-medium">
              ✓ chain verified &middot; prev_hash linked
            </span>
          </div>
          
          {/* Audit Log Table Container */}
          <div className="border border-[#0b132b]/5 rounded-2xl bg-white/40 backdrop-blur-md overflow-hidden flex flex-col min-h-[283px]">
            <div className="overflow-x-auto w-full scrollbar-none flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#0b132b]/5 bg-[#0b132b]/[0.01] text-[9px] font-bold uppercase tracking-wider text-[#0b132b]/40 font-mono">
                    <th className="py-3.5 px-6">Sequence</th>
                    <th className="py-3.5 px-6">Event Type</th>
                    <th className="py-3.5 px-6">Canonical Action Description</th>
                    <th className="py-3.5 px-6">Block Hash</th>
                    <th className="py-3.5 px-6">Timestamp</th>
                    <th className="py-3.5 px-6">Policy Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {ledger.map((entry) => (
                      <motion.tr
                        key={entry.sequence}
                        initial={{ opacity: 0, y: -10, backgroundColor: 'rgba(191,106,46,0.03)' }}
                        animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(255,255,255,0)' }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="border-b border-[#0b132b]/5 hover:bg-[#0b132b]/[0.01] text-xs text-[#0b132b]/80 group transition-colors duration-150"
                      >
                        <td className="py-3.5 px-6 font-mono text-[10px] text-[#0b132b]/40">{entry.sequence}</td>
                        <td className="py-3.5 px-6 font-mono text-[10px]">
                          <span className="text-[#bf6a2e] font-semibold">{entry.eventType}</span>
                        </td>
                        <td className="py-3.5 px-6 font-sans text-xs group-hover:text-[#0b132b] transition-colors">{entry.action}</td>
                        <td className="py-3.5 px-6 font-mono text-[10px] text-[#0b132b]/40">{entry.hash}</td>
                        <td className="py-3.5 px-6 font-mono text-[10px] text-[#0b132b]/50">{entry.timestamp}</td>
                        <td className="py-3.5 px-6">
                          <span className={`inline-block font-mono text-[9px] font-bold border px-1.5 py-0.5 rounded ${getVerdictStyle(entry.verdict)}`}>
                            {entry.verdict}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </section>
        
      </main>

      {/* Footer logotype */}
      <footer className="py-8 border-t border-[#0b132b]/5 bg-white/20 backdrop-blur-sm mt-auto relative z-10 text-center">
        <div className="max-w-[1200px] w-full mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#0b132b]/40">
          <span>&copy; 2026 AgentGrid Security, Inc. All rights reserved.</span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            <span className="font-mono">ledger anchor verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default AgentGridDashboard;
