'use client';

import { useEffect } from 'react';
import { useSupabase } from './supabase-provider';
import { api } from '../../trpc/client';

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { user: supabaseUser, session } = useSupabase();
  const syncUserMutation = api.auth.syncSupabaseUser.useMutation();

  useEffect(() => {
    if (supabaseUser && session) {
      // Sync the Supabase user to our Prisma database
      const userMetadata = supabaseUser.user_metadata as { full_name?: string } | null;
      const fullName = userMetadata?.full_name || supabaseUser.email?.split('@')[0] || 'Unknown User';
      
      syncUserMutation.mutate({
        supabaseUserId: supabaseUser.id,
        email: supabaseUser.email || '',
        name: fullName,
      }, {
        onSuccess: (data) => {
          console.log('User synced successfully:', data);
        },
        onError: (error) => {
          console.error('Failed to sync user:', error);
        }
      });
    }
  }, [supabaseUser, session, syncUserMutation]);

  return <>{children}</>;
}

