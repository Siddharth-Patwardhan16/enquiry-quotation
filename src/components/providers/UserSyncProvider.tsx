'use client';

import { useEffect, useRef } from 'react';
import { useSupabase } from './supabase-provider';
import { api } from '../../trpc/client';

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { user: supabaseUser, session } = useSupabase();
  const { mutate: createEmployee } = api.auth.createEmployee.useMutation();
  const lastSyncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (supabaseUser && session && lastSyncedUserId.current !== supabaseUser.id) {
      lastSyncedUserId.current = supabaseUser.id;

      // Create employee record for the Supabase user
      const userMetadata = supabaseUser.user_metadata as { full_name?: string } | null;
      const fullName = userMetadata?.full_name ?? supabaseUser.email?.split('@')[0] ?? 'Unknown User';

      createEmployee({
        email: supabaseUser.email ?? '',
        name: fullName,
        role: 'MARKETING', // Default role
      });
    }
  }, [supabaseUser?.id, supabaseUser?.email, session?.access_token, createEmployee]);

  return <>{children}</>;
}
