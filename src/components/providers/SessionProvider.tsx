// src/components/SessionProvider.tsx
'use client';

import { api } from '../../trpc/client';
import { createContext, useContext } from 'react';

// Create a context to hold the session data
const SessionContext = createContext<unknown | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = api.auth.getSession.useQuery();
  return (
    <SessionContext.Provider value={session ?? null}>
      {children}
    </SessionContext.Provider>
  );
}

// A handy hook to easily access the session anywhere in the app
export const useSession = () => {
  return useContext(SessionContext);
};