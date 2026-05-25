"use client";

import { useFlags } from "launchdarkly-react-client-sdk";

// Neutral guidance banner shown when targeting-vulnerable-customer-mode is true.
// FCA Consumer Duty principle: suppress harm transparently. The customer should
// know we've adapted what they see, and have a clear path to manage it.
export default function VulnerableCustomerBanner() {
  const flags = useFlags<{ targetingVulnerableCustomerMode?: boolean }>();
  if (flags.targetingVulnerableCustomerMode !== true) return null;

  return (
    <aside
      role="status"
      className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-6"
    >
      <p className="font-medium text-amber-200">
        We&apos;ve adjusted what you see based on your account preferences.
      </p>
      <p className="mt-1 text-amber-100/80">
        Helix follows FCA Consumer Duty guidance — we hide aggressive
        promotions and the highest-cost tier when your circumstances suggest a
        more measured choice fits better.{" "}
        <a
          href="#manage"
          className="underline decoration-amber-300/50 underline-offset-2 hover:text-amber-50"
        >
          Manage your preferences
        </a>
        .
      </p>
    </aside>
  );
}
