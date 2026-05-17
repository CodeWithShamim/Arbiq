"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { usePostJob } from "@/hooks/useArbiqContract";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle2, Hash, Lock, Info } from "lucide-react";

export default function PostJobPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [form, setForm] = useState({ title: "", description: "", budget: "", deadline: "" });
  const { postJob, txState, isLoading } = usePostJob();

  useEffect(() => {
    if (txState.status === "finalized") {
      toast.success("Job posted & escrow locked!");
      setTimeout(() => router.push("/jobs"), 2000);
    }
    if (txState.status === "error" && txState.error) toast.error(txState.error);
  }, [txState.status, txState.error, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.budget || !form.deadline) {
      toast.error("Please fill in all fields");
      return;
    }
    const budget = parseFloat(form.budget);
    if (isNaN(budget) || budget <= 0) { toast.error("Budget must be positive"); return; }
    postJob({ title: form.title, description: form.description, deadline: form.deadline, budgetEth: form.budget });
  };

  const minDeadline = new Date();
  minDeadline.setDate(minDeadline.getDate() + 1);
  const minDateStr = minDeadline.toISOString().split("T")[0];
  const descLen = form.description.length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      {/* Header strip */}
      <div
        className="pt-24 pb-10 px-4 md:px-8 relative overflow-hidden"
        style={{ borderBottom: "1px solid var(--border-page)" }}
      >
        <div className="orb orb-violet absolute w-80 h-80 -top-20 right-10 opacity-25" />
        <div className="max-w-2xl mx-auto relative z-10">
          <p className="label mb-2" style={{ color: "#7c3aed" }}>Create</p>
          <h1 className="headline" style={{ color: 'var(--text-primary)' }}>Post a Job</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Your budget locks in escrow instantly. AI reads your description to judge deliveries.
          </p>
        </div>
      </div>

      <main className="px-4 md:px-8 py-10">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <Field label="Job Title" hint="Be specific — e.g. 'Build a 5-page React site with Tailwind'">
              <Input
                placeholder="Build a responsive landing page"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                disabled={isLoading}
                maxLength={100}
              />
            </Field>

            {/* Description */}
            <Field label="Job Description" hint="The AI reads this word-for-word to evaluate the freelancer's submission">
              <div className="relative">
                <Textarea
                  rows={7}
                  placeholder="List every deliverable clearly. The more specific you are, the more accurate the AI's judgment will be.

Example: 'Deliver a fully responsive 5-page website (Home, About, Services, Portfolio, Contact) using React + Tailwind. Must include a contact form, mobile menu, and dark-mode toggle. Deploy to Vercel and share the live URL.'"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  disabled={isLoading}
                  maxLength={3000}
                />
                <span
                  className="absolute bottom-3 right-3 text-[11px] font-mono"
                  style={{ color: descLen > 2700 ? "#ef4444" : "#5a5a7a" }}
                >
                  {descLen}/3000
                </span>
              </div>
            </Field>

            {/* Budget + Deadline */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Budget (GEN)" hint="Held in escrow until job is resolved">
                <div className="relative">
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.5"
                    value={form.budget}
                    onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                    disabled={isLoading}
                    style={{ paddingRight: "3rem" }}
                  />
                  <span
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold"
                    style={{ color: "#7c3aed" }}
                  >
                    GEN
                  </span>
                </div>
              </Field>
              <Field label="Deadline">
                <Input
                  type="date"
                  min={minDateStr}
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  disabled={isLoading}
                  className="[color-scheme:dark]"
                />
              </Field>
            </div>

            {/* Escrow callout */}
            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.2)",
              }}
            >
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#a78bfa" }} />
              <p className="text-xs leading-relaxed" style={{ color: "#c4b5fd" }}>
                <span className="font-semibold">Escrow:</span> Your{" "}
                <span className="font-mono font-bold">{form.budget || "0"} GEN</span>{" "}
                will be sent to the contract the moment you post. It&apos;s held securely until the AI evaluates the delivery or you manually approve.
              </p>
            </div>

            {/* Wallet banner */}
            {!isConnected && (
              <div
                className="flex items-center justify-between gap-4 p-4 rounded-xl"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <span className="flex items-center gap-2 text-sm" style={{ color: "#fca5a5" }}>
                  <AlertCircle className="w-4 h-4" />
                  Connect your wallet to post
                </span>
                <button
                  type="button"
                  onClick={() => openConnectModal?.()}
                  className="text-sm font-semibold underline transition-colors"
                  style={{ color: "#f87171" }}
                >
                  Connect
                </button>
              </div>
            )}

            {/* Tx hash */}
            {txState.txHash && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-xs"
                style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
              >
                <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <span style={{ color: "var(--text-muted)" }}>Tx:</span>
                <code className="font-mono truncate flex-1" style={{ color: "#a78bfa" }}>{txState.txHash}</code>
                {txState.status === "finalized" && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
              </div>
            )}

            {/* Status lines */}
            {txState.status === "pending" && (
              <p className="text-sm flex items-center gap-2" style={{ color: "var(--color-warning)" }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending transaction to the network…
              </p>
            )}
            {txState.status === "finalized" && (
              <p className="text-sm flex items-center gap-2" style={{ color: "var(--color-success)" }}>
                <CheckCircle2 className="w-4 h-4" />
                Job posted! Redirecting…
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!isConnected || isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Posting Job…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Post Job & Lock Escrow
                </>
              )}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-semibold" style={{ color: "var(--text-label)" }}>
          {label}
        </label>
        {hint && (
          <div className="group relative">
            <Info className="w-3.5 h-3.5 cursor-help" style={{ color: "var(--text-label-dim)" }} />
            <div
              className="absolute left-0 top-6 w-56 p-2.5 rounded-lg text-xs z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-mid)",
                color: "var(--text-secondary)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              {hint}
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
