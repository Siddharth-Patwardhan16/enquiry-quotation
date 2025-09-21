'use client';

import { useEffect } from 'react';
import { useSupabase } from './supabase-provider';
import { api } from '../../trpc/client';

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { user: supabaseUser, session } = useSupabase();
  const createEmployeeMutation = api.auth.createEmployee.useMutation();

  useEffect(() => {
    if (supabaseUser && session) {
      // Create employee record for the Supabase user
      const userMetadata = supabaseUser.user_metadata as { full_name?: string } | null;
      const fullName = userMetadata?.full_name ?? supabaseUser.email?.split('@')[0] ?? 'Unknown User';
      
      createEmployeeMutation.mutate({
        email: supabaseUser.email ?? '',
        name: fullName,
        role: 'MARKETING', // Default role
      }, {
        onSuccess: (_data) => {
        },
        onError: (error) => {
          console.error('Failed to create employee:', error);
        }
      });
    }
  }, [supabaseUser, session, createEmployeeMutation]);

  return <>{children}</>;
}

