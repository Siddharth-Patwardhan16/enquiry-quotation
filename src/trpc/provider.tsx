"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React, { useState } from "react";
import superjson from "superjson";

import { api } from "./client";
import { env } from "../lib/env";
import { createClient } from "@/lib/supabase-client";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
          api.createClient({
        links: [
          httpBatchLink({
            url: (typeof window !== 'undefined' ? window.location.origin : env.NEXT_PUBLIC_APP_URL) + "/api/trpc",
            transformer: superjson,
            headers: async () => {
              const supabase = createClient();
              const { data } = await supabase.auth.getSession();
              const token = data.session?.access_token;
              return token ? { Authorization: `Bearer ${token}` } : {};
            },
          }),
        ],
      }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
