'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Lock, User, Eye, EyeOff, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showApiKey, setShowApiKey] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Check connection status on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const apiUrl = 'https://jalvirtual.com/api/user';
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsLoading(true);
    const success = await login(apiKey);
    setIsLoading(false);
    
    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20">
                  {/* JAL Logo */}
                  <img 
                    src="/img/jal-logo.png" 
                    alt="JAL Logo" 
                    className="h-16 w-auto animate-float object-contain"
                    style={{ maxWidth: '120px', maxHeight: '64px' }}
                    onLoad={() => console.log('✅ JAL logo loaded successfully')}
                    onError={() => console.log('❌ JAL logo failed to load')}
                  />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              JAL ACARS
            </h1>
            <p className="text-gray-300 text-lg font-medium">
              Aircraft Communications Addressing and Reporting System
            </p>
            <div className="mt-4 h-1 w-24 bg-gradient-to-r from-red-500 to-transparent mx-auto rounded-full"></div>
          </div>

          {/* Login Form */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* API Key Input */}
              <div className="space-y-2">
                <label htmlFor="apiKey" className="block text-sm font-semibold text-white/90 mb-3">
                  <Lock className="inline h-4 w-4 mr-2" />
                  JAL Virtual Pilot API Key
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-red-400 transition-colors" />
                  </div>
                  <input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your pilot API key"
                    className="block w-full pl-12 pr-12 py-4 border border-white/20 rounded-xl bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 backdrop-blur-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                  >
                    {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !apiKey.trim()}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <User className="h-5 w-5 mr-3" />
                    Sign In to ACARS
                  </>
                )}
              </button>
            </form>

            {/* Connection Status */}
            <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/90">Connection Status:</span>
                <div className="flex items-center">
                  {connectionStatus === 'checking' && (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400 mr-2"></div>
                      <span className="text-xs text-yellow-400 font-medium">Checking...</span>
                    </>
                  )}
                  {connectionStatus === 'online' && (
                    <>
                      <Wifi className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-xs text-green-400 font-medium">Online</span>
                    </>
                  )}
                  {connectionStatus === 'offline' && (
                    <>
                      <WifiOff className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-xs text-red-400 font-medium">Offline</span>
                    </>
                  )}
                </div>
              </div>
              {connectionStatus === 'offline' && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-300">
                      Unable to connect to JAL Virtual servers. Please check your internet connection or VPN settings.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white/90 mb-4 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Getting Started
              </h3>
              <ul className="text-xs text-gray-300 space-y-2">
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Obtain your pilot API key from JAL Virtual Airlines</span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Log in to your JAL Virtual account to generate API key</span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Enter your API key above to access ACARS system</span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Configure your Hoppie ID in settings after login</span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Connect to ACARS network for messaging</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 animate-fade-in">
            <p className="text-sm text-gray-400 font-medium">
              JAL Virtual Airlines • Professional ACARS System
            </p>
            <div className="mt-2 h-px w-32 bg-gradient-to-r from-transparent via-gray-500 to-transparent mx-auto"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.2s both;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
