"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { usePostJob } from "@/hooks/useArbiqContract";
import { useAccount, useConnect } from "wagmi";
import { injected } from "@wagmi/connectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle2, Hash } from "lucide-react";
import { useEffect } from "react";

export default function PostJobPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { connect } = useConnect();

  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
  });

  const { postJob, txState, isLoading } = usePostJob();

  // Navigate to job detail when finalized
  useEffect(() => {
    if (txState.status === "finalized") {
      toast.success("Job posted successfully!");
      setTimeout(() => router.push("/jobs"), 2000);
    }
    if (txState.status === "error" && txState.error) {
      toast.error(txState.error);
    }
  }, [txState.status, txState.error, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.budget || !form.deadline) {
      toast.error("Please fill in all fields");
      return;
    }

    const budget = parseFloat(form.budget);
    if (isNaN(budget) || budget <= 0) {
      toast.error("Budget must be a positive number");
      return;
    }

    postJob({
      title: form.title,
      description: form.description,
      deadline: form.deadline,
      budgetEth: form.budget,
    });
  };

  const minDeadline = new Date();
  minDeadline.setDate(minDeadline.getDate() + 1);
  const minDateStr = minDeadline.toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <main className="pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Post a Job</h1>
            <p className="text-gray-400 text-sm">
              Describe your project clearly. The AI will use your description to evaluate deliveries.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>
                Budget is held in escrow until the job is completed or disputed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Job Title
                  </label>
                  <Input
                    placeholder="e.g. Build a responsive landing page"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    disabled={isLoading}
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Job Description
                    <span className="text-gray-500 font-normal ml-2 text-xs">
                      (the AI reads this to judge deliveries)
                    </span>
                  </label>
                  <Textarea
                    rows={6}
                    placeholder="Describe exactly what you need delivered. Be specific — the AI uses this to evaluate the freelancer's work."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    disabled={isLoading}
                    maxLength={3000}
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {form.description.length} / 3000
                  </p>
                </div>

                {/* Budget + Deadline row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Budget (GEN)
                    </label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="0.5"
                      value={form.budget}
                      onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Deadline
                    </label>
                    <Input
                      type="date"
                      min={minDateStr}
                      value={form.deadline}
                      onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                      disabled={isLoading}
                      className="[color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Wallet connect banner */}
                {!isConnected && (
                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 text-sm text-purple-200">
                      <AlertCircle className="w-4 h-4 text-purple-400" />
                      Connect your wallet to post
                    </div>
                    <button
                      type="button"
                      onClick={() => connect({ connector: injected() })}
                      className="text-sm font-semibold text-purple-300 hover:text-purple-200 transition-colors underline"
                    >
                      Connect
                    </button>
                  </div>
                )}

                {/* Tx hash */}
                {txState.txHash && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 text-xs">
                    <Hash className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-500">Tx:</span>
                    <code className="text-purple-400 font-mono truncate flex-1">
                      {txState.txHash}
                    </code>
                    {txState.status === "finalized" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                )}

                {/* Status message */}
                {txState.status === "pending" && (
                  <p className="text-sm text-yellow-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending transaction…
                  </p>
                )}
                {txState.status === "finalized" && (
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Job posted! Redirecting…
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={!isConnected || isLoading}
                  size="lg"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Posting Job…
                    </>
                  ) : (
                    "Post Job & Lock Escrow"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
