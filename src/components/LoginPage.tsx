'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Plane, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Check connection status on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const apiUrl = customApiUrl || 'https://jalvirtual.com/api/user';
        await fetch(apiUrl, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        setConnectionStatus('online');
      } catch {
        setConnectionStatus('offline');
      }
    };

    checkConnection();
  }, [customApiUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsLoading(true);
    const success = await login(apiKey, customApiUrl);
    setIsLoading(false);
    
    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Plane className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">JAL ACARS</h1>
          <p className="text-gray-300">Aircraft Communications Addressing and Reporting System</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
                JAL Virtual Pilot API Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your pilot API key"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
              </button>
            </div>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-700 rounded-md border border-gray-600">
                <div>
                  <label htmlFor="customApiUrl" className="block text-sm font-medium text-gray-300 mb-2">
                    Custom API URL (Optional)
                  </label>
                  <input
                    id="customApiUrl"
                    type="url"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                    placeholder="https://your-api.com/user"
                    className="block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Leave empty to use default JAL Virtual API
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !apiKey.trim()}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Connection Status */}
          <div className="mt-6 p-3 rounded-md bg-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Connection Status:</span>
              <div className="flex items-center">
                {connectionStatus === 'checking' && (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-500 mr-2"></div>
                    <span className="text-xs text-yellow-400">Checking...</span>
                  </>
                )}
                {connectionStatus === 'online' && (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-green-400">Online</span>
                  </>
                )}
                {connectionStatus === 'offline' && (
                  <>
                    <div className="h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-xs text-red-400">Offline</span>
                  </>
                )}
              </div>
            </div>
            {connectionStatus === 'offline' && (
              <p className="text-xs text-red-400 mt-1">
                Unable to connect to JAL Virtual servers. Please check your internet connection or VPN settings.
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-700 rounded-md">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Getting Started:</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Obtain your pilot API key from JAL Virtual Airlines</li>
              <li>• Log in to your JAL Virtual account to generate API key</li>
              <li>• Enter your API key above to access ACARS system</li>
              <li>• Configure your Hoppie ID in settings after login</li>
              <li>• Connect to ACARS network for messaging</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            JAL Virtual Airlines • Professional ACARS System
          </p>
        </div>
      </div>
    </div>
  );
}
