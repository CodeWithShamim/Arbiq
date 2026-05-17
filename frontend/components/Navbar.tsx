"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "@wagmi/connectors";
import { truncateAddress } from "@/lib/utils";
import { Button } from "./ui/button";
import { Briefcase, LayoutDashboard, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/jobs", label: "Browse Jobs", icon: Briefcase },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mr-8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <span className="font-bold text-white text-lg tracking-tight">Arbiq</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1 flex-1">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <Link href="/jobs/new">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <PlusCircle className="w-4 h-4" />
            Post a Job
          </Button>
        </Link>

        {isConnected && address ? (
          <button
            onClick={() => disconnect()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors font-mono"
          >
            {truncateAddress(address)}
          </button>
        ) : (
          <Button
            size="sm"
            onClick={() => connect({ connector: injected() })}
          >
            Connect Wallet
          </Button>
        )}
      </div>
    </nav>
  );
}
