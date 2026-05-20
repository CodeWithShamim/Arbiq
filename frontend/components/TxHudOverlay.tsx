"use client";

import { useEffect, useState, useRef } from "react";

// Maps consensusStatus strings from GenLayer to human-readable phase labels
const PHASE_LABEL: Record<string, string> = {
  PENDING:     "SUBMITTING TO MEMPOOL...",
  PROPOSING:   "VALIDATORS PROPOSING...",
  COMMITTING:  "COMMITTING VOTES...",
  REVEALING:   "REVEALING VERDICTS...",
  ACCEPTED:    "CONSENSUS REACHED",
  FINALIZED:   "FINALIZED",
  UNDETERMINED:"DELIBERATING...",
  CANCELED:    "CANCELED",
};

const PHASE_ORDER = ["PENDING", "PROPOSING", "COMMITTING", "REVEALING", "ACCEPTED"];

// Rotating flavour messages per operation type
const FLAVOUR: Record<string, string[]> = {
  take_job: [
    "Locking you in as freelancer...",
    "Broadcasting commitment...",
    "Validators verifying intent...",
    "Consensus imminent...",
  ],
  submit_delivery: [
    "Uploading evidence hash on-chain...",
    "Validators reading your work...",
    "Cross-referencing job spec...",
    "AI jury deliberating...",
  ],
  auto_evaluate: [
    "Spawning AI validator nodes...",
    "LLMs reading evidence URL...",
    "Cross-examining job description...",
    "Running optimistic democracy...",
    "Validators casting votes...",
    "Computing consensus verdict...",
  ],
  release_manually: [
    "Broadcasting approval signal...",
    "Validators confirming release...",
    "Transferring escrow funds...",
    "Updating contract state...",
  ],
  post_job: [
    "Locking escrow funds...",
    "Publishing job to network...",
    "Validators recording job...",
    "Awaiting consensus write...",
  ],
  send_message: [
    "Encrypting message...",
    "Broadcasting on-chain...",
    "Validators recording...",
    "Immutable storage confirmed...",
  ],
  resubmit_delivery: [
    "Uploading revised evidence...",
    "Broadcasting resubmission...",
    "Validators processing appeal...",
    "Resetting to delivered state...",
  ],
  post_job_milestones: [
    "Locking escrow with milestones...",
    "Publishing milestone plan...",
    "Validators recording job structure...",
    "Awaiting consensus write...",
  ],
  submit_milestone_delivery: [
    "Uploading milestone evidence...",
    "Broadcasting to validators...",
    "Milestone delivery recorded...",
    "Awaiting finalization...",
  ],
  approve_milestone: [
    "Broadcasting approval...",
    "Releasing milestone payment...",
    "Validators confirming transfer...",
    "Updating milestone state...",
  ],
  default: [
    "Broadcasting transaction...",
    "Validators deliberating...",
    "Consensus forming...",
    "Awaiting finalization...",
  ],
};

const OP_LABEL: Record<string, string> = {
  take_job:                 "ACCEPT JOB",
  submit_delivery:          "SUBMIT DELIVERY",
  auto_evaluate:            "AI EVALUATION",
  release_manually:         "MANUAL RELEASE",
  post_job:                 "POST JOB",
  send_message:             "SEND MESSAGE",
  resubmit_delivery:        "RESUBMIT DELIVERY",
  post_job_milestones:      "POST JOB (MILESTONES)",
  submit_milestone_delivery:"SUBMIT MILESTONE",
  approve_milestone:        "APPROVE MILESTONE",
  default:                  "TRANSACTION",
};

interface Props {
  status: "idle" | "pending" | "finalizing" | "finalized" | "error";
  consensusStatus: string | null;
  txHash: string | null;
  error: string | null;
  operation?: string;
  onDismiss?: () => void;
}

export function TxHudOverlay({ status, consensusStatus, txHash, error, operation = "default", onDismiss }: Props) {
  const [scanY, setScanY] = useState(0);
  const [flavourIdx, setFlavourIdx] = useState(0);
  const [blink, setBlink] = useState(true);
  const [block, setBlock] = useState(() => 4821094 + Math.floor(Math.random() * 200));
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  const isActive = status === "pending" || status === "finalizing";
  const isDone = status === "finalized";
  const isError = status === "error";

  const flavours = FLAVOUR[operation] ?? FLAVOUR.default;
  const opLabel = OP_LABEL[operation] ?? OP_LABEL.default;

  // Which consensus phases are done
  const currentPhase = consensusStatus ?? "PENDING";
  const currentPhaseIdx = PHASE_ORDER.indexOf(currentPhase);

  // Progress: pending=15%, each phase adds ~17%
  const phasePct = isDone ? 100 : isError ? 100 : Math.min(
    15 + (currentPhaseIdx >= 0 ? currentPhaseIdx * 18 : 0) + (isActive ? (elapsed % 18) : 0),
    98
  );

  useEffect(() => {
    if (!isActive) return;
    if (startRef.current === null) startRef.current = Date.now();

    const scan    = setInterval(() => setScanY((y) => (y + 2.2) % 100), 16);
    const blinker = setInterval(() => setBlink((b) => !b), 700);
    const blk     = setInterval(() => setBlock((b) => b + 1), 3000);
    const flv     = setInterval(() => setFlavourIdx((i) => (i + 1) % flavours.length), 1800);
    const timer   = setInterval(() => {
      if (startRef.current) setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(scan); clearInterval(blinker); clearInterval(blk);
      clearInterval(flv);  clearInterval(timer);
    };
  }, [isActive, flavours.length]);

  // Reset start time when a new tx begins
  useEffect(() => {
    if (status === "pending") {
      startRef.current = Date.now();
      setElapsed(0);
      setFlavourIdx(0);
    }
  }, [status]);

  if (status === "idle") return null;

  const phaseColor = isError ? "#ff6b6b" : isDone ? "#00ff88" : "#00f0ff";
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const elapsedStr = `${mins > 0 ? `${mins}m ` : ""}${secs}s`;

  return (
    <div
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        color: phaseColor,
        position: "relative",
        width: "100%",
        marginTop: 12,
      }}
    >
      {/* Corner brackets */}
      {[
        { top: 0, left: 0, borderTop: `1.5px solid ${phaseColor}`, borderLeft: `1.5px solid ${phaseColor}` },
        { top: 0, right: 0, borderTop: `1.5px solid ${phaseColor}`, borderRight: `1.5px solid ${phaseColor}` },
        { bottom: 0, left: 0, borderBottom: `1.5px solid ${phaseColor}`, borderLeft: `1.5px solid ${phaseColor}` },
        { bottom: 0, right: 0, borderBottom: `1.5px solid ${phaseColor}`, borderRight: `1.5px solid ${phaseColor}` },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", width: 14, height: 14, ...s }} />
      ))}

      <div
        style={{
          padding: "16px 18px",
          background: isError ? "rgba(255,107,107,0.04)" : isDone ? "rgba(0,255,136,0.04)" : "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Scan line — only during active */}
        {isActive && (
          <div
            style={{
              position: "absolute",
              left: 0, right: 0,
              top: `${scanY}%`,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${phaseColor}66, ${phaseColor}, ${phaseColor}66, transparent)`,
              boxShadow: `0 0 8px ${phaseColor}`,
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        )}

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: phaseColor,
              boxShadow: `0 0 6px ${phaseColor}`,
              opacity: isActive && blink ? 1 : (isDone || isError ? 1 : 0.25),
              transition: "opacity 0.15s",
            }} />
            <span style={{ fontSize: 10, letterSpacing: "0.22em", fontWeight: 700 }}>
              {opLabel}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isActive && (
              <span style={{ fontSize: 9, color: `${phaseColor}88`, letterSpacing: "0.1em" }}>
                {elapsedStr}
              </span>
            )}
            {(isDone || isError) && onDismiss && (
              <button
                onClick={onDismiss}
                style={{ background: "none", border: "none", color: `${phaseColor}88`, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}
              >×</button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: `${phaseColor}66`, marginBottom: 4, letterSpacing: "0.12em" }}>
            <span>CONSENSUS PROGRESS</span>
            <span>{Math.floor(phasePct)}%</span>
          </div>
          <div style={{ height: 2, background: `${phaseColor}18`, borderRadius: 1, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${phasePct}%`,
              background: isError
                ? "linear-gradient(90deg,#ff6b6b,#ff4444)"
                : isDone
                  ? "linear-gradient(90deg,#00f0ff,#00ff88)"
                  : `linear-gradient(90deg,${phaseColor},#00ff88)`,
              boxShadow: `0 0 6px ${phaseColor}`,
              borderRadius: 1,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        {/* Phase stepper */}
        {!isError && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
            {PHASE_ORDER.slice(0, 4).map((phase, i) => {
              const done = currentPhaseIdx > i || isDone;
              const active = currentPhaseIdx === i && isActive;
              return (
                <div key={phase} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    background: done ? `${phaseColor}22` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${done || active ? phaseColor : "rgba(255,255,255,0.08)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8,
                    boxShadow: active ? `0 0 8px ${phaseColor}` : undefined,
                    transition: "all 0.3s",
                    flexShrink: 0,
                  }}>
                    {done ? "✓" : (i + 1)}
                  </div>
                  {i < 3 && (
                    <div style={{
                      flex: 1, height: 1,
                      background: done ? phaseColor : "rgba(255,255,255,0.08)",
                      transition: "background 0.4s",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Current status message */}
        {isError ? (
          <div style={{ fontSize: 11, color: "#ff6b6b", marginBottom: 10 }}>
            ✗ {error ?? "Transaction failed"}
          </div>
        ) : isDone ? (
          <div style={{ fontSize: 11, color: "#00ff88", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>
            ✓ CONSENSUS REACHED · FINALIZED
          </div>
        ) : (
          <div style={{ fontSize: 10, color: `${phaseColor}cc`, marginBottom: 10, minHeight: 16 }}>
            {PHASE_LABEL[currentPhase] ?? currentPhase}
          </div>
        )}

        {/* Flavour text — only while active */}
        {isActive && (
          <div style={{
            fontSize: 9, color: `${phaseColor}66`,
            letterSpacing: "0.08em", marginBottom: 10,
            minHeight: 14,
          }}>
            {flavours[flavourIdx]}
          </div>
        )}

        {/* Live stats row */}
        <div style={{
          display: "flex", gap: 16, paddingTop: 10,
          borderTop: `1px solid ${phaseColor}18`,
        }}>
          {[
            { label: "BLOCK", value: `#${block.toLocaleString()}` },
            { label: "NETWORK", value: "BRADBURY" },
            { label: "VALIDATORS", value: "5 / 5" },
            ...(txHash ? [{ label: "TX", value: `${txHash.slice(0, 6)}…${txHash.slice(-4)}` }] : []),
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 7, color: `${phaseColor}44`, letterSpacing: "0.14em", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 9, color: `${phaseColor}cc` }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
