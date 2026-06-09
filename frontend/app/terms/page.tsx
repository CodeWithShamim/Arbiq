import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing use of the Arbiq web interface — a non-custodial, AI-enforced freelance escrow dApp on the GenLayer Bradbury Testnet.",
};

export default function TermsPage() {
  return (
    <LegalPage
      icon="scale"
      title="Terms of Service"
      updated="June 9, 2026"
      intro="These terms govern your use of the Arbiq web interface. Arbiq is experimental, non-custodial software that helps you interact with smart contracts on the GenLayer Bradbury Testnet. By connecting a wallet or submitting a transaction, you agree to these terms."
      sections={[
        {
          heading: "What Arbiq is",
          body: (
            <>
              <p>
                Arbiq is a decentralized freelance escrow marketplace. Clients lock a GEN budget in
                a smart contract; freelancers deliver work; and AI validator consensus on GenLayer
                evaluates deliveries against the job spec to decide whether funds release.
              </p>
              <p>
                The Arbiq interface is a front end to public smart contracts. We do not operate the
                marketplace as an intermediary, hold funds, or guarantee outcomes.
              </p>
            </>
          ),
        },
        {
          heading: "Testnet & no monetary value",
          body: (
            <p>
              Arbiq runs on the GenLayer Bradbury Testnet. GEN tokens used here have{" "}
              <strong>no real monetary value</strong> and are for testing only. Nothing on Arbiq is an
              offer of securities, investment advice, or a financial service. The network may be reset
              or discontinued at any time, which can erase balances and history.
            </p>
          ),
        },
        {
          heading: "Non-custodial & your responsibility",
          body: (
            <>
              <p>
                You are solely responsible for your wallet, private keys, and every transaction you
                sign. We never take custody of your keys or funds and cannot reverse, refund, or
                recover transactions once they are submitted on-chain.
              </p>
              <p>
                You agree not to use Arbiq for unlawful work, to post infringing or harmful content,
                or to attempt to manipulate, spam, or attack the contracts or the AI evaluation
                process.
              </p>
            </>
          ),
        },
        {
          heading: "AI evaluation & disputes",
          body: (
            <>
              <p>
                Deliveries are assessed by multiple GenLayer validators running an LLM against the
                job description and submitted evidence, then reaching consensus. AI evaluation is
                probabilistic and may not match your subjective judgment.
              </p>
              <p>
                By posting or accepting a job you accept that the contract&apos;s on-chain verdict —
                including disputes, refunds, deadlines, and releases — is final and enforced by code,
                not by us. Write clear specs and submit clear evidence: outcomes depend on them.
              </p>
            </>
          ),
        },
        {
          heading: "Public on-chain content",
          body: (
            <p>
              Job descriptions, proposals, messages, evidence links, and ratings you submit are
              written to a public blockchain. They are permanent, world-readable, and cannot be
              edited or deleted by us. Do not submit confidential or sensitive information.
            </p>
          ),
        },
        {
          heading: "No warranty",
          body: (
            <p>
              Arbiq is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of
              any kind, express or implied, including merchantability, fitness for a particular
              purpose, availability, or non-infringement. The software is experimental and may contain
              bugs.
            </p>
          ),
        },
        {
          heading: "Limitation of liability",
          body: (
            <p>
              To the maximum extent permitted by law, the Arbiq project and its contributors are not
              liable for any loss of funds, data, or opportunity, or for any indirect, incidental, or
              consequential damages arising from your use of the interface or the underlying contracts.
            </p>
          ),
        },
        {
          heading: "Changes & contact",
          body: (
            <p>
              We may update these terms as the project evolves; continued use after an update
              constitutes acceptance. The &quot;Last updated&quot; date reflects the latest revision.
              Questions can be raised via the project&apos;s GitHub repository linked in the footer.
            </p>
          ),
        },
      ]}
    />
  );
}
