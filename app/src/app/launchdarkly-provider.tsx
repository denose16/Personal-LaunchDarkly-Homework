"use client";

import { LDProvider, useLDClient } from "launchdarkly-react-client-sdk";
import { useEffect, type ReactNode } from "react";
import { DEMO_USER_MATT } from "@/lib/mock-user";
import { buildLDContext } from "@/lib/ld-context";
import { IdentityProvider, useDemoIdentity } from "./identity-provider";

type Props = {
  children: ReactNode;
};

const clientSideID = process.env.NEXT_PUBLIC_LD_CLIENT_SIDE_ID;

// IMPORTANT: LDProvider does NOT auto-call identify() when its `context` prop
// changes (verified by reading the compiled SDK source — componentDidUpdate
// only handles deferInitialization, not prop swaps). So we mount LDProvider
// once with a stable boot context, then keep the client in sync with the
// current persona via LDClientSync.
const BOOT_CONTEXT = buildLDContext(DEMO_USER_MATT);

export default function LaunchDarklyProvider({ children }: Props) {
  if (!clientSideID) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[LaunchDarkly] NEXT_PUBLIC_LD_CLIENT_SIDE_ID missing — flag evaluations will return defaults."
      );
    }
    return <>{children}</>;
  }

  return (
    <IdentityProvider>
      <LDProvider
        clientSideID={clientSideID}
        context={BOOT_CONTEXT}
        options={{
          streaming: true,
          sendEventsOnlyForVariation: true,
          evaluationReasons: true,
        }}
      >
        <LDClientSync />
        {children}
      </LDProvider>
    </IdentityProvider>
  );
}

// Lives inside LDProvider so useLDClient() resolves. Watches the demo
// persona and calls ldClient.identify whenever it changes.
function LDClientSync() {
  const { user } = useDemoIdentity();
  const ldClient = useLDClient();

  useEffect(() => {
    if (!ldClient) return;
    ldClient.identify(buildLDContext(user)).catch((err) => {
      console.error("[Helix] LDClient.identify failed:", err);
    });
  }, [user, ldClient]);

  return null;
}
