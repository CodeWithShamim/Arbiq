"use client";

// Live animated consensus status panel shown after a writeContract call.
// Displays: pending wallet signature → broadcasting → each consensus phase → finalized/error.

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, ExternalLink, Hash } from "lucide-react";

type TxPhase = "idle" | "pending" | "finalizing" | "finalized" | "error";

interface Props {
  status: TxPhase;
  txHash: string | null;
  error?: string | null;
  // label shown while finalizing, e.g. "AI validators reviewing…"
  finalizingLabel?: string;
}

// The consensus phases GenLayer goes through in order
const CONSENSUS_PHASES = [
  { key: "submitting",  label: "Submitting to network",   color: "#38bdf8" },
  { key: "pending",     label: "Picked up by consensus",  color: "#a78bfa" },
  { key: "proposing",   label: "Leader proposing",        color: "#a78bfa" },
  { key: "committing",  label: "Validators committing",   color: "#f59e0b" },
  { key: "revealing",   label: "Validators revealing",    color: "#fb923c" },
  { key: "accepted",    label: "Consensus reached",       color: "#22c55e" },
];

// Map hook status → how many phases are "done"
function phasesComplete(status: TxPhase): number {
  if (status === "pending")    return 1;
  if (status === "finalizing") return 3; // animates through the middle ones
  if (status === "finalized")  return CONSENSUS_PHASES.length;
  return 0;
}

export function ConsensusTxStatus({ status, txHash, error, finalizingLabel }: Props) {
  const [animPhase, setAnimPhase] = useState(0);

  // While finalizing, animate through phases 1→4 to show live progress
  useEffect(() => {
    if (status !== "finalizing") {
      setAnimPhase(phasesComplete(status));
      return;
    }
    setAnimPhase(1);
    const timings = [800, 1800, 3200, 5000]; // ms delays per phase step
    const timers = timings.map((delay, i) =>
      setTimeout(() => setAnimPhase(i + 2), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [status]);

  if (status === "idle") return null;

  const explorerBase = "https://explorer-bradbury.genlayer.com";

  return (
    <div className="consensus-panel anim-fade-up">
      {/* Header row */}
      <div className="consensus-header">
        {status === "finalized" ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span style={{ color: "#86efac", fontWeight: 700 }}>Consensus reached</span>
          </>
        ) : status === "error" ? (
          <>
            <XCircle className="w-4 h-4 text-red-400" />
            <span style={{ color: "#fca5a5", fontWeight: 700 }}>Transaction failed</span>
          </>
        ) : (
          <>
            <div className="consensus-spinner">
              <div className="orbit-dot" />
              <div className="orbit-dot" />
              <div className="orbit-dot" />
            </div>
            <span style={{ color: "#a78bfa", fontWeight: 600 }}>
              {status === "pending"
                ? "Waiting for wallet confirmation…"
                : (finalizingLabel ?? "GenLayer validators reaching consensus…")}
            </span>
          </>
        )}
      </div>

      {/* Phase stepper */}
      {status !== "error" && (
        <div className="consensus-phases">
          {CONSENSUS_PHASES.map((phase, i) => {
            const done    = i < animPhase;
            const active  = i === animPhase - 1 && status !== "finalized";
            const waiting = !done && !active;
            return (
              <div key={phase.key} className="consensus-phase-row">
                {/* Connector line above (skip first) */}
                {i > 0 && (
                  <div
                    className={`consensus-connector ${done ? "connector-done" : "connector-wait"}`}
                  />
                )}
                {/* Dot */}
                <div
                  className={`consensus-dot ${
                    done    ? "dot-done"   :
                    active  ? "dot-active" :
                    "dot-wait"
                  }`}
                  style={active ? { borderColor: phase.color, boxShadow: `0 0 8px ${phase.color}66` } : {}}
                >
                  {done && (
                    <svg width="8" height="8" viewBox="0 0 8 8">
                      <polyline points="1,4 3,6 7,2" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  )}
                  {active && <div className="dot-pulse" style={{ background: phase.color }} />}
                </div>
                {/* Label */}
                <span
                  className="consensus-phase-label"
                  style={{
                    color: done    ? "#86efac"         :
                           active  ? phase.color        :
                           waiting ? "var(--text-muted)" : "var(--text-muted)",
                    fontWeight: active ? 600 : 400,
                    opacity: waiting ? 0.5 : 1,
                  }}
                >
                  {phase.label}
                  {active && <span className="phase-dots" />}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Error message */}
      {status === "error" && error && (
        <p className="consensus-error">{error}</p>
      )}

      {/* Tx hash row */}
      {txHash && (
        <div className="consensus-hash-row">
          <Hash className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
          <code className="font-mono text-[10px] truncate flex-1" style={{ color: "#a78bfa" }}>
            {txHash}
          </code>
          <a
            href={`${explorerBase}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View on explorer"
            className="consensus-explorer-link"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
