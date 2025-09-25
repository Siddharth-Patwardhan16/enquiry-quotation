// src/app/dashboard/layout.tsx
'use client';

import { useAuth } from '../../components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { NavigationLayout } from '../../components/layout/NavigationLayout';
import { NavigationSkeleton } from '../../components/ui/loading-skeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // If still loading, show a loading state
  if (isLoading) {
    return <NavigationSkeleton />;
  }

  // If authenticated, render the navigation layout with page content
  return isAuthenticated ? <NavigationLayout>{children}</NavigationLayout> : null;
}