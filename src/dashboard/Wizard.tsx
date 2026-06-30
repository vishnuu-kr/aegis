import { useEffect, useRef, useState } from "react";
import {
  X, ArrowRight, ArrowLeft, Check, Cpu, Plug, Copy, Smartphone, Terminal,
} from "lucide-react";
import { useStore } from "./data";
import { Toggle } from "./ui";
import { Button } from "@/components/ui/button";
import { getStored, setStored } from "@/lib/storage";
import type { RouteKey } from "./Dashboard";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { title: "Agent setup", description: "Name and mint your agent" },
  { title: "Providers", description: "Connect the tools it can use" },
  { title: "Link phone", description: "Optional step-up approvals" },
  { title: "Connect AI", description: "Add the MCP server" },
];

export function Wizard({ onClose, onFinish, onNav }: { onClose: () => void; onFinish: () => void; onNav: (k: RouteKey) => void }) {
  const { providers, toggleProvider, addDevice, toast } = useStore();
  const [step, setStep] = useState(() => Number(getStored("aeg-dash-wizard-step") || "0"));
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setStepPersisted = (s: number | ((prev: number) => number)) => {
    setStep((prev) => {
      const nextVal = typeof s === "function" ? s(prev) : s;
      setStored("aeg-dash-wizard-step", String(Math.min(nextVal, STEPS.length - 1)));
      return nextVal;
    });
  };

  const [agentName, setAgentName] = useState("Research Agent");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [client, setClient] = useState<"claude" | "chatgpt" | "custom">("claude");
  const [copied, setCopied] = useState(false);

  const setupProviders = providers.filter((p) => ["stripe", "twilio", "github"].includes(p.id));
  const last = step === STEPS.length - 1;

  const next = () => setStepPersisted((s) => s + 1);
  const back = () => setStepPersisted((s) => Math.max(0, s - 1));
  const finish = () => {
    toast("Setup complete", "ok");
    onFinish();
    onNav("dashboard");
  };

  const cmd = `aegis mcp add --client ${client} --agent "${agentName}"`;

  const stepIcons = [
    <Cpu size={18} key="0" />,
    <Plug size={18} key="1" />,
    <Smartphone size={18} key="2" />,
    <Terminal size={18} key="3" />,
  ];

  return (
    <motion.div
      className="ad-wizmask-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div ref={dialogRef} className="ad-wiz-full" role="dialog" aria-modal="true" aria-label="Aegis setup wizard">
        <button className="ad-wiz-close" onClick={onClose} aria-label="Close wizard"><X size={18} /></button>

        <div className="ad-wiz-top">
          <div className="flex items-center gap-2.5">
            <span className="ad-brand-mark"><Cpu size={14} /></span>
            <b className="text-sm">Connect Agent</b>
          </div>
          <div className="ad-wiz-progress">
            {STEPS.map((s, i) => (
              <div key={s.title} className={`ad-wiz-progress-dot ${i === step ? "is-active" : i < step ? "done" : ""}`} />
            ))}
          </div>
        </div>

        <div className="ad-wiz-stage">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className="ad-wiz-step-panel"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="ad-wiz-step-hero">
                <motion.span
                  className="ad-wiz-step-icon"
                  initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  key={`icon-${step}`}
                >
                  {stepIcons[step]}
                </motion.span>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  key={`title-${step}`}
                >
                  {STEPS[step].title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  key={`desc-${step}`}
                >
                  {STEPS[step].description}
                </motion.p>
              </div>

              {step === 0 && (
                <div className="ad-wiz-card">
                  <label className="ad-field-label">Agent name</label>
                  <input className="ad-input" value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="e.g., Research Agent" />
                  <div className="ad-wiz-summary">
                    <div>
                      <span className="ad-wiz-summary-label">Identity</span>
                      <span className="ad-wiz-summary-value mono">did:key:z6Mk…</span>
                    </div>
                    <div>
                      <span className="ad-wiz-summary-label">Scope</span>
                      <span className="ad-wiz-summary-value">Self-sovereign & revocable</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="ad-wiz-card flat">
                  <p className="ad-wiz-card-lead">Connect the tools your agent will use. Credentials are vaulted.</p>
                  <div className="ad-stack">
                    {setupProviders.map((p) => (
                      <div key={p.id} className="ad-row">
                        <span className="ad-row-ico" style={{ color: p.connected ? "var(--primary)" : "var(--muted-foreground)" }}><Plug size={17} /></span>
                        <div style={{ flex: 1 }}>
                          <div className="ad-row-name">{p.name}</div>
                          <div className="ad-row-desc">{p.desc}</div>
                        </div>
                        <Toggle on={p.connected} onClick={() => toggleProvider(p.id)} label={`connect ${p.name}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="ad-wiz-card">
                  <p className="ad-wiz-card-lead">Add a phone for step-up approvals. Skip this if you only want dashboard approvals.</p>
                  <label className="ad-field-label">Phone number</label>
                  <div className="flex gap-2 mb-3">
                    <input className="ad-input" placeholder="+1 555 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    <Button variant="outline" size="sm" disabled={!phone.trim()} onClick={() => { setCodeSent(true); toast("Code sent", "info"); }}>Send code</Button>
                  </div>
                  {codeSent && (
                    <>
                      <label className="ad-field-label">Verification code</label>
                      <div className="flex gap-2">
                        <input className="ad-input mono" placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value)} style={{ maxWidth: 160, letterSpacing: 4 }} />
                        <Button size="sm" disabled={code.length < 4} onClick={() => { addDevice(`Phone · ${phone}`, "phone"); next(); }}>Verify & link</Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="ad-wiz-card flat">
                  <p className="ad-wiz-card-lead">Run the command in your AI client. The MCP tools will appear automatically.</p>
                  <div className="ad-wiz-seg">
                    {(["claude", "chatgpt", "custom"] as const).map((c) => (
                      <button key={c} className={client === c ? "is-active" : ""} onClick={() => setClient(c)}>
                        {c === "claude" ? "Claude" : c === "chatgpt" ? "ChatGPT" : "Custom"}
                      </button>
                    ))}
                  </div>
                  <div className="ad-wiz-snippet">
                    <code><span className="ad-wiz-snippet-prompt">$</span> {cmd}</code>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard?.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 2000); toast("Copied to clipboard", "ok"); }} aria-label="Copy command">
                      <Copy size={15} />
                    </Button>
                    {copied && <span className="ad-wiz-copied">Copied</span>}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="ad-wiz-foot-full">
          <Button variant="ghost" onClick={back} disabled={step === 0} className="gap-1.5">
            <ArrowLeft size={15} /> Back
          </Button>
          <div className="flex gap-2">
            {step < STEPS.length - 1 && (
              <Button variant="ghost" onClick={onClose}>Skip setup</Button>
            )}
            <Button onClick={last ? finish : next} className="gap-1.5">
              {last ? <>Finish <Check size={15} /></> : <>Next <ArrowRight size={15} /></>}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
