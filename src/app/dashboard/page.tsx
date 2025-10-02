'use client';

import { AuthProvider } from '@/hooks/useAuth';
import { ACARSProvider } from '@/hooks/useACARS';
import Dashboard from '@/components/Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function DashboardContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading JAL ACARS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return <Dashboard />;
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <ACARSProvider>
        <DashboardContent />
      </ACARSProvider>
    </AuthProvider>
  );
}
