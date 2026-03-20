"use client";

import { ReactNode, useCallback, useMemo, useState } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useConvexAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        const res = await fetch("/api/auth/token");
        if (!res.ok) return null;
        const data = await res.json();
        setToken(data.token);
        return data.token;
      } catch {
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated: token !== null,
      fetchAccessToken,
    }),
    [isLoading, token, fetchAccessToken],
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
