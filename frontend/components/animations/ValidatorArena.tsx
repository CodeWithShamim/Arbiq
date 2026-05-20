"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const VALIDATOR_NAMES = ["ALPHA-7", "BETA-3", "GAMMA-1", "DELTA-9", "EPSILON-5"];
const DELIBERATION_MSGS = [
  "Analyzing evidence...", "Cross-referencing blockchain...", "Parsing contract terms...",
  "Evaluating claim validity...", "Running consensus check...", "Querying LLM oracle...",
  "Verifying cryptographic proof...", "Deliberating with peers...",
];
const VERDICT_MSGS = { approve: "CASE APPROVED", dispute: "CASE DISPUTED", pending: "DELIBERATING..." };

interface ValidatorState {
  id: number;
  name: string;
  status: "idle" | "thinking" | "voted";
  vote: "approve" | "dispute" | null;
  msg: string;
  msgVisible: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  result?: "approve" | "dispute" | null;
}

export function ValidatorArena({ visible, onClose, result }: Props) {
  const [validators, setValidators] = useState<ValidatorState[]>(
    VALIDATOR_NAMES.map((name, i) => ({ id: i, name, status: "idle", vote: null, msg: "", msgVisible: false }))
  );
  const [phase, setPhase] = useState<"idle" | "deliberating" | "verdict">("idle");
  const [verdict, setVerdict] = useState<"approve" | "dispute" | null>(null);
  const [confetti, setConfetti] = useState<{ id: number; x: number; color: string; angle: number }[]>([]);
  const [shaking, setShaking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timerRef.current.forEach(clearTimeout); timerRef.current = []; };

  useEffect(() => {
    if (!visible) {
      clearTimers();
      setPhase("idle");
      setVerdict(null);
      setConfetti([]);
      setShaking(false);
      setValidators(VALIDATOR_NAMES.map((name, i) => ({ id: i, name, status: "idle", vote: null, msg: "", msgVisible: false })));
      return;
    }

    setPhase("deliberating");

    // Stagger validators into thinking state
    VALIDATOR_NAMES.forEach((_, i) => {
      const t1 = setTimeout(() => {
        setValidators((prev) => prev.map((v) => v.id === i
          ? { ...v, status: "thinking", msg: DELIBERATION_MSGS[Math.floor(Math.random() * DELIBERATION_MSGS.length)], msgVisible: true }
          : v));
      }, i * 400 + 300);
      timerRef.current.push(t1);

      // Cycle messages
      const t2 = setTimeout(() => {
        setValidators((prev) => prev.map((v) => v.id === i
          ? { ...v, msg: DELIBERATION_MSGS[Math.floor(Math.random() * DELIBERATION_MSGS.length)] }
          : v));
      }, i * 400 + 1500);
      timerRef.current.push(t2);
    });

    // Vote one by one
    const voteResult = result ?? (Math.random() > 0.3 ? "approve" : "dispute");
    VALIDATOR_NAMES.forEach((_, i) => {
      const delay = 2500 + i * 600 + Math.random() * 400;
      const t = setTimeout(() => {
        const vote = voteResult === "approve"
          ? (Math.random() > 0.15 ? "approve" : "dispute")
          : (Math.random() > 0.15 ? "dispute" : "approve");
        setValidators((prev) => prev.map((v) => v.id === i
          ? { ...v, status: "voted", vote, msgVisible: false }
          : v));
      }, delay);
      timerRef.current.push(t);
    });

    // Final verdict
    const t3 = setTimeout(() => {
      setPhase("verdict");
      setVerdict(voteResult);
      if (voteResult === "approve") {
        const pieces = Array.from({ length: 30 }, (_, i) => ({
          id: i, x: Math.random() * 100, color: ["#00f0ff","#00ff88","#ffd700","#ff00ff","#ff6b6b"][i % 5],
          angle: Math.random() * 360,
        }));
        setConfetti(pieces);
        setTimeout(() => setConfetti([]), 3000);
      } else {
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
      }
    }, 2500 + VALIDATOR_NAMES.length * 700);
    timerRef.current.push(t3);

    return clearTimers;
  }, [visible, result]);

  const hexPoints = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");

  const validatorPositions = [
    { x: 50, y: 20 },
    { x: 20, y: 42 },
    { x: 80, y: 42 },
    { x: 30, y: 72 },
    { x: 70, y: 72 },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9000,
            background: "rgba(0,0,0,0.92)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            fontFamily: '"JetBrains Mono",monospace',
          }}
          onClick={phase === "verdict" ? onClose : undefined}
        >
          {/* Confetti */}
          {confetti.map((c) => (
            <motion.div
              key={c.id}
              initial={{ x: `${c.x}vw`, y: "-5vh", rotate: 0, opacity: 1 }}
              animate={{ y: "110vh", rotate: c.angle * 3, opacity: 0 }}
              transition={{ duration: 2.5 + Math.random(), ease: "easeIn" }}
              style={{ position: "fixed", top: 0, left: 0, width: 10, height: 10, background: c.color, borderRadius: 2, pointerEvents: "none" }}
            />
          ))}

          <div style={{ fontSize: 10, color: "#00f0ff88", letterSpacing: "0.3em", marginBottom: 24 }}>
            ◆ AI VALIDATOR COURTROOM ◆
          </div>

          {/* Arena SVG */}
          <motion.div
            animate={shaking ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: "relative", width: 380, height: 320 }}
          >
            <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
              {/* Arena ring */}
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(0,240,255,0.1)" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(0,240,255,0.06)" strokeWidth="0.3" strokeDasharray="2 3" />

              {/* Connecting lines to center */}
              {validatorPositions.map((pos, i) => (
                <line key={i} x1="50" y1="50" x2={pos.x} y2={pos.y}
                  stroke={validators[i].vote === "approve" ? "#00ff8844" : validators[i].vote === "dispute" ? "#ff6b6b44" : "rgba(0,240,255,0.08)"}
                  strokeWidth="0.4"
                  strokeDasharray={validators[i].status === "thinking" ? "1 1.5" : undefined}
                />
              ))}

              {/* Validator hexagons */}
              {validatorPositions.map((pos, i) => {
                const v = validators[i];
                const color = v.vote === "approve" ? "#00ff88" : v.vote === "dispute" ? "#ff6b6b" : v.status === "thinking" ? "#00f0ff" : "#334";
                return (
                  <g key={i}>
                    <polygon
                      points={hexPoints(pos.x, pos.y, 9)}
                      fill="rgba(0,0,0,0.8)"
                      stroke={color}
                      strokeWidth="0.6"
                      style={{ filter: v.status !== "idle" ? `drop-shadow(0 0 3px ${color})` : undefined }}
                    />
                    <text x={pos.x} y={pos.y - 1} textAnchor="middle" fontSize="2.5" fill={color} fontFamily="JetBrains Mono">
                      {v.name}
                    </text>
                    <text x={pos.x} y={pos.y + 3.5} textAnchor="middle" fontSize="3.5" fill={color}>
                      {v.vote === "approve" ? "✓" : v.vote === "dispute" ? "✗" : v.status === "thinking" ? "…" : "○"}
                    </text>
                  </g>
                );
              })}

              {/* Center orb */}
              <circle cx="50" cy="50" r="6" fill="rgba(0,0,0,0.9)" stroke="#00f0ff" strokeWidth="0.4" />
              <text x="50" y="51.5" textAnchor="middle" fontSize="2.8" fill="#00f0ff" fontFamily="JetBrains Mono">
                {phase === "verdict" ? (verdict === "approve" ? "PASS" : "FAIL") : "AI"}
              </text>
            </svg>

            {/* Speech bubbles */}
            {validators.map((v, i) => (
              <AnimatePresence key={i}>
                {v.msgVisible && v.msg && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: "absolute",
                      left: `${validatorPositions[i].x}%`,
                      top: `${validatorPositions[i].y}%`,
                      transform: "translate(-50%, -140%)",
                      background: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(0,240,255,0.3)",
                      borderRadius: 4,
                      padding: "3px 6px",
                      fontSize: 7,
                      color: "#00f0ff",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  >
                    {v.msg}
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </motion.div>

          {/* Verdict banner */}
          <AnimatePresence>
            {phase === "verdict" && verdict && (
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{
                  marginTop: 24,
                  padding: "12px 32px",
                  background: verdict === "approve" ? "rgba(0,255,136,0.1)" : "rgba(255,107,107,0.1)",
                  border: `2px solid ${verdict === "approve" ? "#00ff88" : "#ff6b6b"}`,
                  borderRadius: 8,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  color: verdict === "approve" ? "#00ff88" : "#ff6b6b",
                  textShadow: `0 0 20px ${verdict === "approve" ? "#00ff88" : "#ff6b6b"}`,
                }}
              >
                {VERDICT_MSGS[verdict]}
              </motion.div>
            )}
          </AnimatePresence>

          {phase === "deliberating" && (
            <div style={{ marginTop: 20, fontSize: 9, color: "#00f0ff66", letterSpacing: "0.2em" }}>
              VALIDATORS DELIBERATING...
            </div>
          )}

          {phase === "verdict" && (
            <div style={{ marginTop: 12, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
              [ click anywhere to dismiss ]
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
