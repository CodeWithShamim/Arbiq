"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTheme } from "@/lib/theme-context";
import { PlusCircle, Sun, Moon, ChevronDown, LogOut } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";

const navLinks = [
  { href: "/",           label: "Home"      },
  { href: "/jobs",       label: "Browse"    },
  { href: "/dashboard",  label: "Dashboard" },
  { href: "/analytics",  label: "Analytics" },
  { href: "/docs",       label: "Docs"      },
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
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        borderBottom: "1px solid var(--nav-border)",
      }}
    >
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 mr-6 flex-shrink-0 group">
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: "#a78bfa",
            boxShadow: "0 0 8px #a78bfa",
            animation: "brandPulse 2s ease-in-out infinite",
          }}
        />
        <span
          className="font-display text-xl tracking-widest"
          style={{ color: "var(--text-primary)", letterSpacing: "0.14em" }}
        >
          ARBIQ
        </span>
      </Link>

      {/* Center nav links */}
      <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
        {navLinks.map(({ href, label }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="relative px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-150"
              style={{ color: active ? "#a78bfa" : "var(--text-muted)" }}
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: isLight
                      ? "rgba(124,58,237,0.08)"
                      : "rgba(124,58,237,0.14)",
                    border: "1px solid rgba(124,58,237,0.22)",
                  }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Post a Job shortcut */}
        <Link
          href="/jobs/new"
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
          style={{
            background: isLight ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.22)",
            color: "#a78bfa",
          }}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Post
        </Link>

        {/* Notifications */}
        <NotificationCenter />

        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            background: isLight ? "rgba(109,40,217,0.07)" : "rgba(255,255,255,0.06)",
            border: isLight ? "1px solid rgba(109,40,217,0.14)" : "1px solid rgba(255,255,255,0.09)",
            color: "var(--text-secondary)",
          }}
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Wallet button */}
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
                  <button
                    onClick={openConnectModal}
                    className="btn-primary px-4 py-1.5 rounded-lg text-white text-sm font-bold"
                  >
                    Connect
                  </button>
                ) : chain.unsupported ? (
                  <button
                    onClick={openChainModal}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      padding: "6px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Wrong Network
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={openAccountModal}
                      style={{
                        background: isLight ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.14)",
                        border: "1px solid rgba(124,58,237,0.28)",
                        color: isLight ? "#6d28d9" : "#c4b5fd",
                        borderRadius: 10,
                        padding: "5px 12px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontFamily: '"JetBrains Mono", monospace',
                      }}
                    >
                      {account.ensName ?? truncate(account.address)}
                      <ChevronDown className="w-3 h-3" style={{ opacity: 0.6 }} />
                    </button>
                    <button
                      onClick={openAccountModal}
                      title="Disconnect wallet"
                      style={{
                        background: isLight ? "rgba(239,68,68,0.07)" : "rgba(239,68,68,0.12)",
                        border: "1px solid rgba(239,68,68,0.22)",
                        color: "#ef4444",
                        borderRadius: 10,
                        padding: "5px 9px",
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
