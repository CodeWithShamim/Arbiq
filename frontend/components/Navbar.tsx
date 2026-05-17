"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTheme } from "@/lib/theme-context";
import { Briefcase, LayoutDashboard, PlusCircle, Zap, Sun, Moon, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/jobs",      label: "Browse Jobs", icon: Briefcase       },
  { href: "/dashboard", label: "Dashboard",   icon: LayoutDashboard },
];

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center px-5 md:px-8"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid var(--nav-border)",
      }}
    >
      {/* ── Logo ── */}
      <Link href="/" className="flex items-center gap-2.5 mr-8 flex-shrink-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)" }}
        >
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-extrabold tracking-tight text-base" style={{ color: "var(--text-primary)" }}>
          Arbiq
        </span>
      </Link>

      {/* ── Nav links ── */}
      <div className="flex items-center gap-0.5 flex-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn("relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150")}
              style={{ color: active ? "var(--violet-400)" : "var(--text-muted)" }}
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: isLight ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.25)",
                  }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Right side ── */}
      <div className="flex items-center gap-2.5">
        {/* Post a Job shortcut */}
        <Link
          href="/jobs/new"
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
          style={{
            background: isLight ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.15)",
            border: "1px solid rgba(124,58,237,0.25)",
            color: "var(--violet-500)",
          }}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Post a Job
        </Link>

        {/* ── Theme toggle ── */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            background: isLight ? "rgba(109,40,217,0.08)" : "rgba(255,255,255,0.06)",
            border: isLight ? "1px solid rgba(109,40,217,0.15)" : "1px solid rgba(255,255,255,0.10)",
            color: "var(--text-secondary)",
          }}
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* ── Wallet button ── */}
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
                })}
              >
                {!connected ? (
                  /* ── Not connected: show Connect button ── */
                  <button
                    onClick={openConnectModal}
                    style={{
                      background: "linear-gradient(135deg,#7c3aed,#6366f1)",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      padding: "7px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 2px 12px rgba(124,58,237,0.35)",
                    }}
                  >
                    Connect Wallet
                  </button>
                ) : chain.unsupported ? (
                  /* ── Wrong network ── */
                  <button
                    onClick={openChainModal}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      padding: "7px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Wrong Network
                  </button>
                ) : (
                  /* ── Connected: show address + disconnect ── */
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Address pill — click opens RainbowKit account modal (has disconnect inside) */}
                    <button
                      onClick={openAccountModal}
                      style={{
                        background: isLight ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.15)",
                        border: "1px solid rgba(124,58,237,0.3)",
                        color: isLight ? "#6d28d9" : "#c4b5fd",
                        borderRadius: 10,
                        padding: "6px 12px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {account.ensName ?? truncate(account.address)}
                      <ChevronDown className="w-3 h-3" style={{ opacity: 0.6 }} />
                    </button>

                    {/* Explicit Disconnect button */}
                    <button
                      onClick={openAccountModal}
                      title="Disconnect wallet"
                      style={{
                        background: isLight ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        color: "#ef4444",
                        borderRadius: 10,
                        padding: "6px 10px",
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </nav>
  );
}
