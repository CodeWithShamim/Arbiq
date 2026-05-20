'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BIOS_LINES = [
  'ARBIQ OS v2.4.1',
  'Copyright © 2026 GenLayer Foundation',
  'Initializing GenVM runtime............ OK',
  'Loading Intelligent Contracts......... OK',
  'Mounting validator nodes [5/5]........ OK',
  'Calibrating LLM jury.................. OK',
  'WARNING: Bias detected in centralized systems',
  'SOLUTION: Deploying AI justice. Stand by.',
];

const LOADING_MSGS = [
  "Bribing validators... just kidding, they're AI",
  'Sharpening the digital gavel...',
  'Teaching robots about contract law...',
  'Asking GPT-4 if it passed the bar exam...',
  "Spinning up the world's angriest LLMs...",
  'Justice incoming in 3... 2... 1...',
];

const GLITCH_COLORS = ['#00f0ff', '#ff00ff', '#00ff88'];

const FRAGMENTS = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  row: Math.floor(i / 4),
  col: i % 4,
  x: (Math.random() - 0.5) * 800,
  y: (Math.random() - 0.5) * 1200,
  rotate: (Math.random() - 0.5) * 360,
}));

type Phase = 'bios' | 'glitch' | 'logo' | 'loading' | 'shatter' | 'done';

export function BootLoader({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('arbiq_booted')) return 'done';
    return 'bios';
  });
  const [biosLines, setBiosLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [glitchColor, setGlitchColor] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [loadingPct, setLoadingPct] = useState(0);
  const [shattering, setShattering] = useState(false);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phase: BIOS typewriter
  useEffect(() => {
    if (phase !== 'bios') return;
    if (lineIdx >= BIOS_LINES.length) {
      setTimeout(() => setPhase('glitch'), 200);
      return;
    }
    const line = BIOS_LINES[lineIdx];
    if (charIdx < line.length) {
      rafRef.current = setTimeout(() => setCharIdx((c) => c + 1), 28);
      setCurrentLine(line.slice(0, charIdx + 1));
    } else {
      rafRef.current = setTimeout(() => {
        setBiosLines((prev) => [...prev, line]);
        setCurrentLine('');
        setCharIdx(0);
        setLineIdx((l) => l + 1);
      }, 60);
    }
    return () => {
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, [phase, lineIdx, charIdx]);

  // Phase: GLITCH
  useEffect(() => {
    if (phase !== 'glitch') return;
    let i = 0;
    const cycle = () => {
      if (i < GLITCH_COLORS.length) {
        setGlitchColor(GLITCH_COLORS[i++]);
        setTimeout(cycle, 90);
      } else {
        setGlitchColor(null);
        setTimeout(() => setPhase('logo'), 100);
      }
    };
    setTimeout(cycle, 50);
  }, [phase]);

  // Phase: LOGO → LOADING
  useEffect(() => {
    if (phase !== 'logo') return;
    const t = setTimeout(() => setPhase('loading'), 700);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase: LOADING bar + messages
  useEffect(() => {
    if (phase !== 'loading') return;
    let pct = 0;
    let msgI = 0;
    const barInterval = setInterval(() => {
      pct += 1.4;
      setLoadingPct(Math.min(pct, 100));
      if (pct >= 100) {
        clearInterval(barInterval);
        clearInterval(msgInterval);
        setTimeout(() => setShattering(true), 200);
        setTimeout(() => setPhase('shatter'), 300);
        setTimeout(() => {
          sessionStorage.setItem('arbiq_booted', '1');
          setPhase('done');
          onDone?.();
        }, 900);
      }
    }, 18);
    const msgInterval = setInterval(() => {
      msgI = (msgI + 1) % LOADING_MSGS.length;
      setLoadingMsg(msgI);
    }, 320);
    return () => {
      clearInterval(barInterval);
      clearInterval(msgInterval);
    };
  }, [phase, onDone]);

  if (phase === 'done') return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[99999] flex flex-col overflow-hidden select-none"
        style={{ background: glitchColor ?? '#000', transition: 'background 0.05s' }}
      >
        {/* BIOS lines */}
        {(phase === 'bios' || phase === 'glitch') && (
          <div className="p-6 flex-1 overflow-hidden">
            {biosLines.map((l, i) => (
              <div
                key={i}
                style={{
                  fontFamily: '"JetBrains Mono",monospace',
                  fontSize: 13,
                  color: l.startsWith('WARNING')
                    ? '#ffcc00'
                    : l.startsWith('SOLUTION')
                      ? '#00ff88'
                      : '#e0e0e0',
                  lineHeight: 1.7,
                }}
              >
                {l}
              </div>
            ))}
            {phase === 'bios' && (
              <div
                style={{
                  fontFamily: '"JetBrains Mono",monospace',
                  fontSize: 13,
                  color: '#e0e0e0',
                  lineHeight: 1.7,
                }}
              >
                {currentLine}
                <span style={{ animation: 'biosBlinkCursor 0.6s step-end infinite' }}>█</span>
              </div>
            )}
          </div>
        )}

        {/* LOGO phase */}
        {(phase === 'logo' || phase === 'loading' || phase === 'shatter') && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <motion.div
              initial={{ y: -300, scaleY: 3, opacity: 0 }}
              animate={{ y: 0, scaleY: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                fontFamily: '"Bebas Neue",sans-serif',
                fontSize: '12vw',
                color: '#00f0ff',
                textShadow: '0 0 40px #00f0ff, 0 0 80px #00f0ff88, 0 0 120px #00f0ff44',
                letterSpacing: '0.08em',
                lineHeight: 1,
              }}
            >
              ARBIQ
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: 14,
                color: '#00ff88',
                letterSpacing: '0.22em',
              }}
            >
              AI ENFORCED FREELANCE JUSTICE
            </motion.div>

            {/* Loading bar */}
            {(phase === 'loading' || phase === 'shatter') && (
              <div className="w-80 mt-4">
                <div
                  style={{
                    height: 2,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 1,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <motion.div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${loadingPct}%`,
                      background: 'linear-gradient(90deg,#00f0ff,#ff00ff,#00ff88)',
                      boxShadow: '0 0 12px #00f0ff, 0 0 24px #ff00ff88',
                      transition: 'width 0.02s linear',
                    }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono",monospace',
                    fontSize: 11,
                    color: 'rgba(0,240,255,0.7)',
                    marginTop: 10,
                    textAlign: 'center',
                  }}
                >
                  {LOADING_MSGS[loadingMsg]}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SHATTER fragments */}
        {shattering &&
          FRAGMENTS.map((f) => (
            <motion.div
              key={f.id}
              initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              animate={{ x: f.x, y: f.y, rotate: f.rotate, opacity: 0 }}
              transition={{ duration: 0.55, delay: f.id * 0.02, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: `${f.col * 25}%`,
                top: `${f.row * 25}%`,
                width: '25%',
                height: '25%',
                background: '#000',
                zIndex: 1,
              }}
            />
          ))}
      </div>
    </AnimatePresence>
  );
}
