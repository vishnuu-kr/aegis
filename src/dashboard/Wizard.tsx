import { useState } from "react";
import {
  X, ArrowRight, ArrowLeft, Check, KeyRound, Cpu, Plug, Copy,
} from "lucide-react";
import { useStore } from "./data";
import { Btn, Chip, Toggle } from "./ui";
import type { RouteKey } from "./Dashboard";
import { motion } from "framer-motion";

const STEPS = [
  { title: "License", optional: true },
  { title: "Agent setup", optional: false },
  { title: "Providers", optional: true },
  { title: "Link phone", optional: true },
  { title: "Connect AI", optional: false },
];

export function Wizard({ onClose, onFinish, onNav }: { onClose: () => void; onFinish: () => void; onNav: (k: RouteKey) => void }) {
  const { providers, toggleProvider, updateSettings, addDevice, toast } = useStore();
  const [step, setStep] = useState(() => Number(localStorage.getItem("aeg-dash-wizard-step") || "0"));

  const setStepPersisted = (s: number | ((prev: number) => number)) => {
    setStep((prev) => {
      const nextVal = typeof s === "function" ? s(prev) : s;
      localStorage.setItem("aeg-dash-wizard-step", String(nextVal));
      return nextVal;
    });
  };

  // step-local state
  const [license, setLicense] = useState("");
  const [agentName, setAgentName] = useState("Research Agent");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [client, setClient] = useState<"claude" | "chatgpt" | "custom">("claude");
  const [copied, setCopied] = useState(false);

  const setupProviders = providers.filter((p) => ["stripe", "twilio", "github"].includes(p.id));
  const last = step === STEPS.length - 1;

  const next = () => (last ? onFinish() : setStepPersisted((s) => s + 1));
  const back = () => setStepPersisted((s) => Math.max(0, s - 1));

  const cmd = `aegis mcp add --client ${client} --agent "${agentName}"`;

  return (
    <motion.div
      className="ad-wizmask"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="ad-wiz"
        role="dialog"
        aria-label="Aegis setup wizard"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0 }}
      >
        <div className="ad-wiz-rail">
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "2px 4px 18px" }}>
            <span className="ad-brand-mark" style={{ width: 26, height: 26 }}><Cpu size={14} /></span>
            <b style={{ fontSize: 14 }}>Setup</b>
          </div>
          {STEPS.map((s, i) => (
            <button key={s.title} className={`ad-wiz-step${i === step ? " is-active" : i < step ? " done" : ""}`} onClick={() => setStepPersisted(i)}>
              <span className="ad-wiz-num">{i < step ? <Check size={13} /> : i + 1}</span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <b>{s.title}</b>
                <span>{s.optional ? "optional" : "required"}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="ad-wiz-body" style={{ position: "relative" }}>
          <button className="ad-iconbtn" style={{ position: "absolute", top: 18, right: 18 }} onClick={onClose} aria-label="Skip wizard"><X /></button>
          <p style={{ fontSize: 12, color: "var(--d-faint)", margin: "0 0 8px", letterSpacing: ".04em" }}>
            Setup wizard · step {step + 1} of {STEPS.length}
          </p>

          {step === 0 && (
            <>
              <h2>License</h2>
              <p className="lead">Activate a key to enforce policies in production. You can skip this — the agent runs without a license while enforcement is in testing mode.</p>
              <div className="ad-banner info" style={{ marginBottom: 18 }}>
                <KeyRound size={16} style={{ flex: "none" }} />
                <div><b>Testing mode:</b> enforcement is evaluated but not blocking. Activate later in Settings → License.</div>
              </div>
              <label className="ad-field-label">License key</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="ad-input" placeholder="paste your license key" value={license} onChange={(e) => setLicense(e.target.value)} />
                <Btn variant="primary" disabled={!license.trim()} onClick={() => { updateSettings({ licenseKey: license.trim() }); toast("License activated", "ok"); next(); }}>Activate</Btn>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2>Agent setup</h2>
              <p className="lead">Give your agent a name. Aegis mints it a cryptographic passport — its own identity, scoped and revocable, never a copy of your keys.</p>
              <label className="ad-field-label">Agent name</label>
              <input className="ad-input" value={agentName} onChange={(e) => setAgentName(e.target.value)} style={{ marginBottom: 16 }} />
              <div className="ad-row" style={{ background: "var(--d-bg-2)" }}>
                <span className="ad-row-ico" style={{ color: "var(--d-crimson)" }}><Cpu size={18} /></span>
                <div style={{ flex: 1 }}>
                  <div className="ad-row-name">{agentName || "Unnamed agent"}</div>
                  <div className="ad-row-desc mono">did:key:z6Mk… minted on save</div>
                </div>
                <Chip tone="ok" dot>passport ready</Chip>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Providers</h2>
              <p className="lead">Connect the tools your agent will use. Credentials are vaulted — the agent can use them, never read them.</p>
              <div className="ad-stack">
                {setupProviders.map((p) => (
                  <div key={p.id} className="ad-row" style={{ background: "var(--d-bg-2)" }}>
                    <span className="ad-row-ico" style={{ color: p.connected ? "var(--d-crimson)" : "var(--d-faint)" }}><Plug size={17} /></span>
                    <div style={{ flex: 1 }}>
                      <div className="ad-row-name">{p.name}</div>
                      <div className="ad-row-desc">{p.desc}</div>
                    </div>
                    <Toggle on={p.connected} onClick={() => toggleProvider(p.id)} label={`connect ${p.name}`} />
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Link phone</h2>
              <p className="lead">Add a phone so you can approve step-up requests from anywhere. Optional — you can always approve from this dashboard.</p>
              <label className="ad-field-label">Phone number</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input className="ad-input" placeholder="+1 555 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Btn variant="ghost" disabled={!phone.trim()} onClick={() => { setCodeSent(true); toast("Code sent", "info"); }}>Send code</Btn>
              </div>
              {codeSent && (
                <>
                  <label className="ad-field-label">Verification code</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="ad-input mono" placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value)} style={{ maxWidth: 160, letterSpacing: 4 }} />
                    <Btn variant="primary" disabled={code.length < 4} onClick={() => { addDevice(`Phone · ${phone}`, "phone"); next(); }}>Verify & link</Btn>
                  </div>
                </>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <h2>Connect AI</h2>
              <p className="lead">Add the Aegis MCP server to your client. The tools appear in the agent automatically, every call governed and logged.</p>
              <div className="ad-seg" style={{ marginBottom: 16 }}>
                {(["claude", "chatgpt", "custom"] as const).map((c) => (
                  <button key={c} className={client === c ? "is-active" : ""} onClick={() => setClient(c)}>
                    {client === c && (
                      <motion.div
                        layoutId="active-seg-wizard"
                        className="ad-seg-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span>{c === "claude" ? "Claude" : c === "chatgpt" ? "ChatGPT" : "Custom"}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 9, background: "var(--d-bg)", border: "1px solid var(--d-line-2)" }}>
                <code className="mono" style={{ flex: 1, fontSize: 12.5, color: "var(--d-ink)" }}><span style={{ color: "var(--d-faint)" }}>$</span> {cmd}</code>
                <div style={{ position: "relative" }}>
                  <button className="ad-iconbtn" aria-label="Copy command" onClick={() => { navigator.clipboard?.writeText(cmd); toast("Copied to clipboard", "ok"); setCopied(true); setTimeout(() => setCopied(false), 2000); }}><Copy /></button>
                  {copied && (
                    <div className="copied-tooltip" style={{ position: "absolute", bottom: "100%", right: "50%", transform: "translateX(50%) translateY(-6px)", background: "var(--d-crimson)", color: "var(--d-bg)", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: "bold", zIndex: 100, whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
                      Copied!
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="ad-wiz-foot">
            <div>
              {step > 0 && <Btn variant="ghost" icon={<ArrowLeft size={15} />} onClick={back}>Back</Btn>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {STEPS[step].optional && !last && <Btn variant="subtle" onClick={() => setStepPersisted((s) => s + 1)}>Skip this step</Btn>}
              {last ? (
                <Btn variant="primary" icon={<Check size={15} />} onClick={() => { toast("Setup complete", "ok"); onFinish(); onNav("dashboard"); }}>Finish setup</Btn>
              ) : (
                <Btn variant="primary" icon={<ArrowRight size={15} />} onClick={next}>Next</Btn>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
