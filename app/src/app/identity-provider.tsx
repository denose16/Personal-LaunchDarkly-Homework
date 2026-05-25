"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEMO_USER_MATT,
  DEMO_USER_VULNERABLE,
  type MockUser,
} from "@/lib/mock-user";

export type IdentityKey = "default" | "vulnerable";

const STORAGE_KEY = "helix:demo-identity";

const USERS: Record<IdentityKey, MockUser> = {
  default: DEMO_USER_MATT,
  vulnerable: DEMO_USER_VULNERABLE,
};

function isIdentityKey(v: unknown): v is IdentityKey {
  return v === "default" || v === "vulnerable";
}

type IdentityContextValue = {
  identity: IdentityKey;
  user: MockUser;
  switchTo: (next: IdentityKey) => void;
};

const IdentityContext = createContext<IdentityContextValue | null>(null);

// Holds the demo persona state. Hydrates from localStorage on mount. Does NOT
// call ldClient.identify directly — that responsibility is delegated to
// LDProvider's componentDidUpdate via the context prop in LaunchDarklyProvider.
// (Calling identify manually here fought LDProvider's own prop-change handler.)
export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<IdentityKey>("default");

  // Hydrate from localStorage on mount (avoids SSR/CSR mismatch).
  // Lazy useState initialisation can't read localStorage without causing a
  // hydration mismatch — the canonical Next.js pattern is setState in a
  // mount-only effect. The cascading-renders warning is a false positive here.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isIdentityKey(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIdentity(stored);
    }
  }, []);

  const switchTo = useCallback((next: IdentityKey) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    setIdentity(next);
  }, []);

  return (
    <IdentityContext.Provider value={{ identity, user: USERS[identity], switchTo }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useDemoIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) {
    throw new Error("useDemoIdentity must be used inside <IdentityProvider>");
  }
  return ctx;
}
