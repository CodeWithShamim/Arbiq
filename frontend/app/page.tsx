import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Shield, Zap, Brain, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-white">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-20 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8 text-sm text-purple-300 font-medium">
              <Brain className="w-4 h-4" />
              Powered by GenLayer AI Consensus
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500 leading-tight">
              Freelance Contracts.
              <br />
              Enforced by AI.
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Post jobs, earn crypto, and let an AI validator judge every
              delivery — no middlemen, no disputes that go unresolved.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/jobs/new"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-lg transition-all shadow-lg shadow-purple-500/20"
              >
                Post a Job
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/jobs"
                className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 text-white font-semibold text-lg transition-all"
              >
                Find Work
              </Link>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 animate-slide-up">
            {[
              {
                icon: Shield,
                color: "purple",
                title: "Escrow",
                body: "Client funds are locked in the smart contract on job creation. Neither party can access them until the job is evaluated.",
              },
              {
                icon: Brain,
                color: "blue",
                title: "AI Evaluation",
                body: "GenLayer's AI reads the job spec and the freelancer's submission evidence, then decides whether the work was done.",
              },
              {
                icon: Zap,
                color: "green",
                title: "Instant Verdict",
                body: "Funds release automatically on approval. No waiting on a human arbitrator — the AI gives a final, on-chain verdict.",
              },
            ].map(({ icon: Icon, color, title, body }) => (
              <div
                key={title}
                className={`p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-${color}-500/30 transition-all duration-300 group`}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`text-${color}-400 w-6 h-6`} />
                </div>
                <h3 className="font-bold text-white mb-2 text-lg">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-12">
              How it works
            </h2>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-white/[0.07] hidden md:block" />
              <div className="space-y-8">
                {[
                  {
                    n: 1,
                    title: "Client posts a job",
                    desc: "Describe what you need in plain language. Set a budget in GEN — it's locked in escrow on-chain immediately.",
                  },
                  {
                    n: 2,
                    title: "Freelancer accepts",
                    desc: "Any connected wallet can browse open jobs and claim one. The job moves to Active status.",
                  },
                  {
                    n: 3,
                    title: "Freelancer delivers",
                    desc: "Submit a GitHub link, live URL, or any evidence URL along with a delivery note.",
                  },
                  {
                    n: 4,
                    title: "AI evaluates",
                    desc: "The client (or freelancer) triggers auto_evaluate. GenLayer's AI reads the spec + evidence and decides.",
                  },
                  {
                    n: 5,
                    title: "Funds released",
                    desc: "On approval, GEN flows automatically to the freelancer's wallet. On dispute, funds are held pending appeal.",
                  },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="flex gap-6 md:ml-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center font-bold text-purple-300 text-sm">
                        {n}
                      </div>
                    </div>
                    <div className="pb-2">
                      <h4 className="font-semibold text-white mb-1">{title}</h4>
                      <p className="text-sm text-gray-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/[0.05] py-8 text-center text-sm text-gray-500">
        <p>
          © 2026 Arbiq — Built on{" "}
          <a
            href="https://genlayer.com"
            target="_blank"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            GenLayer
          </a>
        </p>
      </footer>
    </div>
  );
}
