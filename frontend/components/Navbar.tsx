"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTheme } from "@/lib/theme-context";
import { Briefcase, LayoutDashboard, PlusCircle, Zap, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/jobs",       label: "Browse Jobs", icon: Briefcase      },
  { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
];

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
        <span
          className="font-extrabold tracking-tight text-base"
          style={{ color: "var(--text-primary)" }}
        >
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
              className={cn(
                "relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150"
              )}
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
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--violet-500)";
            (e.currentTarget as HTMLElement).style.background = isLight
              ? "rgba(124,58,237,0.14)"
              : "rgba(167,139,250,0.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            (e.currentTarget as HTMLElement).style.background = isLight
              ? "rgba(109,40,217,0.08)"
              : "rgba(255,255,255,0.06)";
          }}
        >
          {isLight ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </button>

        {/* ── RainbowKit ConnectButton ── */}
        <ConnectButton
          chainStatus="none"
          showBalance={false}
          accountStatus="avatar"
          label="Connect Wallet"
        />
      </div>
    </nav>
  );
}
