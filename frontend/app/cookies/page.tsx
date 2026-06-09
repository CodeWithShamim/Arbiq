import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy — Arbiq",
  description:
    "How Arbiq uses cookies and browser storage. Arbiq is a non-custodial dApp on the GenLayer Bradbury Testnet.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      icon="cookie"
      title="Cookie Policy"
      updated="June 9, 2026"
      intro="This policy explains how Arbiq uses cookies and similar browser storage technologies. Arbiq is lightweight by design — we use the minimum needed to keep the app working, plus optional analytics you can decline."
      sections={[
        {
          heading: "What are cookies?",
          body: (
            <p>
              Cookies are small files a site stores in your browser. We also use related technologies
              like localStorage. Together they let the app remember settings and function correctly
              across page loads.
            </p>
          ),
        },
        {
          heading: "Essential cookies & storage",
          body: (
            <>
              <p>
                These are required for the app to work and cannot be turned off. They include:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Your selected theme (light / dark).</li>
                <li>Wallet connection state managed by RainbowKit / WalletConnect.</li>
                <li>Dismissed announcements and your cookie consent choice.</li>
              </ul>
            </>
          ),
        },
        {
          heading: "Optional analytics cookies",
          body: (
            <p>
              If enabled, these help us understand anonymous, aggregate usage (such as which pages are
              visited) so we can improve the interface. They are only set when you choose
              &quot;Accept all.&quot; Choosing &quot;Essential only&quot; leaves them off.
            </p>
          ),
        },
        {
          heading: "Managing your choice",
          body: (
            <p>
              You can accept or reject optional cookies from the banner shown on your first visit. To
              change your decision later, clear this site&apos;s data in your browser settings and the
              banner will reappear. Blocking cookies entirely via your browser may affect how the app
              behaves.
            </p>
          ),
        },
        {
          heading: "Third-party providers",
          body: (
            <p>
              Connecting a wallet or reading chain data involves third-party wallet and RPC providers
              that may set their own cookies under their respective policies. We do not control those
              cookies.
            </p>
          ),
        },
      ]}
    />
  );
}
