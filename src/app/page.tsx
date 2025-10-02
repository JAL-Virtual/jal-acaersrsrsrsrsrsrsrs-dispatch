'use client';

import { AuthProvider } from '@/hooks/useAuth';
import { ACARSProvider } from '@/hooks/useACARS';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';
import { useAuth } from '@/hooks/useAuth';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

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

  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}

export default function Home() {
  return (
    <AuthProvider>
      <ACARSProvider>
        <AppContent />
      </ACARSProvider>
    </AuthProvider>
  );
}
