'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTheme } from '@/lib/theme-context';
import { PlusCircle, Sun, Moon, ChevronDown, LogOut } from 'lucide-react';
import { NotificationCenter } from '@/components/NotificationCenter';

const CA = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';
const EXPLORER_URL = `https://explorer-bradbury.genlayer.com/address/${CA}`;

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/docs', label: 'Docs' },
  { href: '/explorer', label: 'Explorer' },
];

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-[62px] flex items-center px-5 md:px-8"
      style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        borderBottom: '1px solid var(--nav-border)',
      }}
    >
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 mr-8 flex-shrink-0 group">
        {/* Logo mark */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
            boxShadow: '0 0 14px rgba(124,58,237,0.4)',
          }}
        >
          <span
            className="font-display text-white text-sm"
            style={{ letterSpacing: '0.01em', lineHeight: 1 }}
          >
            A
          </span>
        </div>
        <span
          className="font-display text-xl"
          style={{ color: 'var(--text-primary)', letterSpacing: '0.12em' }}
        >
          ARBIQ
        </span>
      </Link>

      {/* Center nav links */}
      <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
        {navLinks.map(({ href, label }) => {
          const active =
            href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className="relative px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors duration-150"
              style={{ color: active ? '#a78bfa' : 'var(--text-muted)' }}
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: isLight ? 'rgba(124,58,237,0.07)' : 'rgba(124,58,237,0.12)',
                    border: '1px solid rgba(124,58,237,0.20)',
                  }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Contract address pill */}
      <a
        href={EXPLORER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all duration-150 mr-2"
        style={{
          background: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.22)',
          color: '#a78bfa',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.16)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.4)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.08)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.22)';
        }}
        title="View contract on Bradbury Explorer"
      >
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>CA</span>
        {CA.slice(0, 6)}…{CA.slice(-4)}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{ opacity: 0.5 }}
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Post a Job shortcut */}
        <Link
          href="/jobs/new"
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150"
          style={{
            background: isLight ? 'rgba(124,58,237,0.07)' : 'rgba(124,58,237,0.10)',
            border: '1px solid rgba(124,58,237,0.20)',
            color: '#a78bfa',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = isLight
              ? 'rgba(124,58,237,0.12)'
              : 'rgba(124,58,237,0.18)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.35)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = isLight
              ? 'rgba(124,58,237,0.07)'
              : 'rgba(124,58,237,0.10)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.20)';
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
            background: isLight ? 'rgba(109,40,217,0.06)' : 'rgba(255,255,255,0.05)',
            border: isLight
              ? '1px solid rgba(109,40,217,0.12)'
              : '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#a78bfa';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
          }}
        >
          {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>

        {/* Wallet button */}
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
                })}
              >
                {!connected ? (
                  <button
                    onClick={openConnectModal}
                    className="btn-primary px-4 py-1.5 rounded-lg text-white text-[13px] font-bold"
                  >
                    Connect Wallet
                  </button>
                ) : chain.unsupported ? (
                  <button
                    onClick={openChainModal}
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      color: '#f87171',
                      border: '1px solid rgba(239,68,68,0.24)',
                      borderRadius: 10,
                      padding: '6px 14px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Wrong Network
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={openAccountModal}
                      style={{
                        background: isLight ? 'rgba(124,58,237,0.07)' : 'rgba(124,58,237,0.12)',
                        border: '1px solid rgba(124,58,237,0.24)',
                        color: isLight ? '#6d28d9' : '#c4b5fd',
                        borderRadius: 10,
                        padding: '5px 12px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontFamily: '"JetBrains Mono", monospace',
                      }}
                    >
                      {account.ensName ?? truncate(account.address)}
                      <ChevronDown className="w-3 h-3" style={{ opacity: 0.5 }} />
                    </button>
                    <button
                      onClick={openAccountModal}
                      title="Disconnect wallet"
                      style={{
                        background: isLight ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.10)',
                        border: '1px solid rgba(239,68,68,0.20)',
                        color: '#ef4444',
                        borderRadius: 10,
                        padding: '5px 9px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
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
