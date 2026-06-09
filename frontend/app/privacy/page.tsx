import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Arbiq",
  description:
    "How the Arbiq web interface handles data. Arbiq is a non-custodial dApp on the GenLayer Bradbury Testnet.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      icon="shield"
      title="Privacy Policy"
      updated="June 9, 2026"
      intro="Arbiq is a non-custodial decentralized application. We do not run user accounts and we never take custody of your funds or private keys. This policy explains the limited data the hosted web interface processes and what stays entirely on-chain or in your browser."
      sections={[
        {
          heading: "What we don't collect",
          body: (
            <>
              <p>
                We do not ask for your name, email, or password to use Arbiq. There is no sign-up.
                Your identity on the platform is your wallet address, which you control.
              </p>
              <p>
                We never have access to your private keys, seed phrase, or wallet funds. All
                transactions are signed locally by your wallet and submitted to the GenLayer chain.
              </p>
            </>
          ),
        },
        {
          heading: "On-chain data",
          body: (
            <>
              <p>
                Job postings, proposals, milestones, ratings, and dispute records are written to the
                GenLayer Bradbury Testnet by you when you sign a transaction. Blockchain data is
                public and permanent — anything you submit on-chain can be read by anyone and cannot
                be deleted by us.
              </p>
              <p>
                Do not put sensitive personal information into on-chain fields (job descriptions,
                messages, evidence URLs, etc.).
              </p>
            </>
          ),
        },
        {
          heading: "Data stored in your browser",
          body: (
            <p>
              We use your browser&apos;s local storage to remember preferences such as your theme,
              dismissed announcements, and your cookie choice. This data stays on your device and is
              never transmitted to us. Clearing your browser storage removes it.
            </p>
          ),
        },
        {
          heading: "Wallet & RPC providers",
          body: (
            <p>
              Connecting a wallet (via RainbowKit / WalletConnect) and reading chain state routes
              requests through third-party RPC and wallet providers. Those providers may see your IP
              address and wallet address per their own privacy policies. We do not control or receive
              that data.
            </p>
          ),
        },
        {
          heading: "Analytics",
          body: (
            <p>
              If enabled, we may collect anonymous, aggregate usage metrics (such as page views) to
              improve the interface. We do not sell data or use it to identify individuals. You can
              opt out via the cookie banner by choosing &quot;Essential only.&quot;
            </p>
          ),
        },
        {
          heading: "Your choices",
          body: (
            <p>
              Because Arbiq is non-custodial and accountless, you remain in control: disconnect your
              wallet at any time, decline optional cookies, and clear local storage to reset
              interface state. On-chain records, by their nature, persist independently of us.
            </p>
          ),
        },
        {
          heading: "Changes & contact",
          body: (
            <p>
              We may update this policy as the project evolves; the &quot;Last updated&quot; date
              reflects the latest revision. Questions can be raised via the project&apos;s GitHub
              repository linked in the footer.
            </p>
          ),
        },
      ]}
    />
  );
}
