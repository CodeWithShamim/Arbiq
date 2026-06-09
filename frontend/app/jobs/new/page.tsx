"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { usePostJob, usePostJobMilestones } from "@/hooks/useArbiqContract";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, AlertCircle, Lock, Info, Plus, X, Layers, Check } from "lucide-react";
import { TxHudOverlay } from "@/components/TxHudOverlay";
import Link from "next/link";

export default function PostJobPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const defaultDeadline = new Date();
  defaultDeadline.setDate(defaultDeadline.getDate() + 7);
  const defaultDeadlineStr = defaultDeadline.toISOString().split("T")[0];

  const [form, setForm] = useState({
    title: "Build a responsive landing page",
    description: `Deliver a fully responsive 5-page website (Home, About, Services, Portfolio, Contact) using React + Tailwind CSS.

Requirements:
- Mobile-first responsive layout
- Dark mode toggle
- Contact form with validation
- Smooth scroll animations
- Deploy to Vercel and share the live URL`,
    budget: "0.5",
    deadline: defaultDeadlineStr,
  });

  const [paymentMode, setPaymentMode] = useState<"single" | "milestones">("single");
  const [milestoneTitles, setMilestoneTitles] = useState(["", ""]);
  const [agreed, setAgreed] = useState(false);

  const { postJob, txState, isLoading } = usePostJob();
  const { postJobMilestones, txState: milestoneState, isLoading: milestoneLoading } = usePostJobMilestones();

  const anyLoading = isLoading || milestoneLoading;

  useEffect(() => {
    if (txState.status === "finalized" || milestoneState.status === "finalized") {
      toast.success("Job posted & escrow locked!");
      setTimeout(() => router.push("/jobs"), 2000);
    }
    if (txState.status === "error" && txState.error) toast.error(txState.error);
    if (milestoneState.status === "error" && milestoneState.error) toast.error(milestoneState.error);
  }, [txState.status, txState.error, milestoneState.status, milestoneState.error, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.budget || !form.deadline) {
      toast.error("Please fill in all fields");
      return;
    }
    const budget = parseFloat(form.budget);
    if (isNaN(budget) || budget <= 0) { toast.error("Budget must be positive"); return; }
    if (!agreed) { toast.error("Please agree to the Privacy Policy & Cookie Policy"); return; }

    if (paymentMode === "milestones") {
      const titles = milestoneTitles.map((t) => t.trim()).filter(Boolean);
      if (titles.length < 2) { toast.error("Add at least 2 milestone titles"); return; }
      postJobMilestones({
        title: form.title,
        description: form.description,
        deadline: form.deadline,
        budgetEth: form.budget,
        milestoneTitles: titles,
      });
    } else {
      postJob({ title: form.title, description: form.description, deadline: form.deadline, budgetEth: form.budget });
    }
  };

  const minDeadline = new Date();
  minDeadline.setDate(minDeadline.getDate() + 1);
  const minDateStr = minDeadline.toISOString().split("T")[0];

  const descLen = form.description.length;
  const activeTxState = paymentMode === "milestones" ? milestoneState : txState;
  const activeOp = paymentMode === "milestones" ? "post_job_milestones" : "post_job";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      {/* Header strip */}
      <div
        className="pt-24 pb-10 px-4 md:px-8 relative overflow-hidden"
        style={{ borderBottom: "1px solid var(--border-page)" }}
      >
        <div className="dot-grid opacity-30" style={{ bottom: 'auto', height: '100%' }} />
        <div className="orb orb-violet absolute w-80 h-80 -top-20 right-10 opacity-25 pointer-events-none" />
        <div className="max-w-2xl mx-auto relative z-10">
          <p className="label mb-3" style={{ color: "#7c3aed" }}>Post work</p>
          <h1 className="font-display text-5xl" style={{ color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
            POST A JOB
          </h1>
          <p className="text-sm mt-2 font-medium" style={{ color: "var(--text-muted)" }}>
            Write a clear spec — the AI evaluates deliveries against it word for word. Budget locks in escrow on submit.
          </p>
        </div>
      </div>

      <main className="px-4 md:px-8 py-10">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Payment mode toggle */}
            <div
              className="flex gap-1 p-1 rounded-xl"
              style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
            >
              {(["single", "milestones"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-200"
                  style={
                    paymentMode === mode
                      ? { background: "rgba(124,58,237,0.18)", color: "var(--text-primary)", border: "1px solid rgba(124,58,237,0.40)" }
                      : { color: "var(--text-muted)", border: "1px solid transparent" }
                  }
                >
                  {mode === "milestones" && <Layers className="w-3.5 h-3.5" />}
                  {mode === "single" ? "Single Payment" : "Milestone Payments"}
                </button>
              ))}
            </div>

            {/* Milestone mode description */}
            {paymentMode === "milestones" && (
              <div
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)" }}
              >
                <Layers className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#a78bfa" }} />
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Budget splits equally across milestones. Freelancers deliver per milestone, you pay each one out individually. Reduces risk on large projects.
                </p>
              </div>
            )}

            {/* Title */}
            <Field label="Job Title" hint="Be specific — e.g. 'Build a 5-page React site with Tailwind'">
              <Input
                placeholder="Build a responsive landing page"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                disabled={anyLoading}
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
                  disabled={anyLoading}
                  maxLength={3000}
                />
                <span
                  className="absolute bottom-3 right-3 text-[11px] font-mono"
                  style={{ color: descLen > 2700 ? "#ef4444" : "var(--text-muted)" }}
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
                    disabled={anyLoading}
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
                  disabled={anyLoading}
                  className="[color-scheme:dark]"
                />
              </Field>
            </div>

            {/* Milestone titles */}
            {paymentMode === "milestones" && (
              <Field label="Milestones" hint="Budget splits equally. Each milestone is paid out independently when approved.">
                <div className="space-y-2">
                  {milestoneTitles.map((title, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className="text-xs font-mono w-5 shrink-0 text-center"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {idx + 1}
                      </span>
                      <Input
                        placeholder={`Milestone ${idx + 1} — e.g. "Design mockups"`}
                        value={title}
                        onChange={(e) => {
                          const next = [...milestoneTitles];
                          next[idx] = e.target.value;
                          setMilestoneTitles(next);
                        }}
                        disabled={anyLoading}
                      />
                      {milestoneTitles.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setMilestoneTitles(milestoneTitles.filter((_, i) => i !== idx))}
                          className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-colors"
                          style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {milestoneTitles.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setMilestoneTitles([...milestoneTitles, ""])}
                      className="flex items-center gap-1.5 text-xs font-semibold mt-1"
                      style={{ color: "#7c3aed" }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add milestone
                    </button>
                  )}
                  {form.budget && milestoneTitles.filter(Boolean).length >= 2 && (
                    <p className="text-[10px] pt-1" style={{ color: "var(--text-muted)" }}>
                      Each milestone ≈{" "}
                      <span className="font-mono font-bold" style={{ color: "#a78bfa" }}>
                        {(parseFloat(form.budget) / milestoneTitles.filter(Boolean).length).toFixed(4)} GEN
                      </span>
                    </p>
                  )}
                </div>
              </Field>
            )}

            {/* Escrow callout */}
            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.2)",
              }}
            >
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#a78bfa" }} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <span className="font-semibold">Escrow:</span> Your{" "}
                <span className="font-mono font-bold">{form.budget || "0"} GEN</span>{" "}
                {paymentMode === "milestones"
                  ? "will be split across milestones and released as each one is approved."
                  : "will be sent to the contract the moment you post. It's held securely until the AI evaluates the delivery or you manually approve."}
              </p>
            </div>

            {/* Wallet banner */}
            {!isConnected && (
              <div
                className="flex items-center justify-between gap-4 p-4 rounded-xl"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <span className="flex items-center gap-2 text-sm" style={{ color: "#dc2626" }}>
                  <AlertCircle className="w-4 h-4" />
                  Connect your wallet to post
                </span>
                <button
                  type="button"
                  onClick={() => openConnectModal?.()}
                  className="text-sm font-semibold underline transition-colors"
                  style={{ color: "#dc2626" }}
                >
                  Connect
                </button>
              </div>
            )}

            {/* Live consensus status */}
            <TxHudOverlay
              status={activeTxState.status}
              consensusStatus={activeTxState.consensusStatus}
              txHash={activeTxState.txHash}
              error={activeTxState.error}
              operation={activeOp}
            />

            {/* Policy agreement */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <button
                type="button"
                role="checkbox"
                aria-checked={agreed}
                onClick={() => setAgreed((v) => !v)}
                className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                style={
                  agreed
                    ? { background: "#7c3aed", border: "1px solid #7c3aed" }
                    : { background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }
                }
              >
                {agreed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </button>
              <span className="text-[13px] leading-relaxed font-medium" style={{ color: "var(--text-muted)" }}>
                I agree to Arbiq&apos;s{" "}
                <Link href="/privacy" target="_blank" className="font-semibold underline" style={{ color: "#a78bfa" }}>
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="/cookies" target="_blank" className="font-semibold underline" style={{ color: "#a78bfa" }}>
                  Cookie Policy
                </Link>
                , and understand that job details are written publicly on-chain.
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isConnected || anyLoading || !agreed}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold text-base"
            >
              {anyLoading ? (
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
        <label className="text-xs font-bold" style={{ color: "var(--text-label)", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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
