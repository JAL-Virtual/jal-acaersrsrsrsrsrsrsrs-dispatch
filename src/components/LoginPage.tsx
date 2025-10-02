'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-red-500/30 to-red-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Secondary accent orbs */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-green-500/20 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      {/* Enhanced Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/20 rounded-full animate-pulse"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Enhanced Header */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="flex items-center justify-center mb-8">
              <div className="relative group">
                {/* Enhanced glow effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/40 to-red-600/30 rounded-3xl blur-2xl animate-pulse group-hover:blur-3xl transition-all duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl animate-pulse delay-300"></div>
                
                {/* Main logo container */}
                <div className="relative bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 group-hover:border-white/30 transition-all duration-500 group-hover:scale-105">
                  {/* JAL Logo */}
                  <Image 
                    src="/img/jal-logo.png" 
                    alt="JAL Logo" 
                    width={140}
                    height={75}
                    className="h-20 w-auto animate-float object-contain filter drop-shadow-lg"
                    style={{ maxWidth: '140px', maxHeight: '75px' }}
                    onLoad={() => console.log('✅ JAL logo loaded successfully')}
                    onError={() => console.log('❌ JAL logo failed to load')}
                  />
                </div>
              </div>
            </div>
            
            {/* Enhanced title */}
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white via-red-100 to-white bg-clip-text text-transparent drop-shadow-lg">
              ACARS Dispatch
            </h1>
            <p className="text-gray-300 text-xl font-medium mb-6 leading-relaxed">
              Aircraft Communications Addressing and Reporting System
            </p>
            
            {/* Enhanced decorative line */}
            <div className="flex items-center justify-center space-x-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-red-500/50"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-red-500/50"></div>
            </div>
          </div>

          {/* Enhanced Login Form */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 animate-slide-up relative overflow-hidden">
            {/* Form background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-blue-500/5 rounded-3xl"></div>
            
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              {/* Enhanced API Key Input */}
              <div className="space-y-3">
                <label htmlFor="apiKey" className="block text-sm font-bold text-white/95 mb-4 flex items-center">
                  <div className="p-2 bg-red-500/20 rounded-lg mr-3">
                    <Lock className="h-4 w-4 text-red-400" />
                  </div>
                  JAL Virtual Pilot API Key
                </label>
                <div className="relative group">
                  {/* Input glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-blue-500/20 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-red-400 transition-colors duration-300" />
                    </div>
                    <input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your pilot API key"
                      className="block w-full pl-14 pr-14 py-5 border border-white/20 rounded-2xl bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 backdrop-blur-sm text-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-white transition-colors duration-300"
                    >
                      {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !apiKey.trim()}
                className="w-full flex justify-center items-center py-6 px-8 border border-transparent rounded-2xl shadow-2xl text-lg font-bold text-white bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 focus:outline-none focus:ring-4 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm relative overflow-hidden group"
              >
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-600/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative flex items-center">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-4"></div>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-white/20 rounded-lg mr-4">
                        <User className="h-6 w-6" />
                      </div>
                      <span>Sign In to ACARS</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Enhanced Connection Status */}
            <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden">
              {/* Status background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-white/95 flex items-center">
                    <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                      <Wifi className="h-4 w-4 text-blue-400" />
                    </div>
                    Connection Status
                  </span>
                  <div className="flex items-center">
                    {connectionStatus === 'checking' && (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-3"></div>
                        <span className="text-sm text-yellow-400 font-bold">Checking...</span>
                      </>
                    )}
                    {connectionStatus === 'online' && (
                      <>
                        <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                          <Wifi className="h-4 w-4 text-green-400" />
                        </div>
                        <span className="text-sm text-green-400 font-bold">Online</span>
                      </>
                    )}
                    {connectionStatus === 'offline' && (
                      <>
                        <div className="p-2 bg-red-500/20 rounded-lg mr-3">
                          <WifiOff className="h-4 w-4 text-red-400" />
                        </div>
                        <span className="text-sm text-red-400 font-bold">Offline</span>
                      </>
                    )}
                  </div>
                </div>
                {connectionStatus === 'offline' && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                    <div className="flex items-start">
                      <div className="p-2 bg-red-500/20 rounded-lg mr-3 flex-shrink-0">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                      </div>
                      <p className="text-sm text-red-300 leading-relaxed">
                        Unable to connect to JAL Virtual servers. Please check your internet connection or VPN settings.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Instructions */}
            <div className="mt-8 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden">
              {/* Instructions background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl"></div>
              
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white/95 mb-6 flex items-center">
                  <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                    <User className="h-5 w-5 text-purple-400" />
                  </div>
                  Getting Started
                </h3>
                <ul className="text-sm text-gray-300 space-y-4">
                  <li className="flex items-start group">
                    <div className="w-2 h-2 bg-gradient-to-r from-red-400 to-red-500 rounded-full mt-2 mr-4 flex-shrink-0 group-hover:scale-125 transition-transform duration-200"></div>
                    <span className="leading-relaxed">Obtain your pilot API key from JAL Virtual Airlines</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="w-2 h-2 bg-gradient-to-r from-red-400 to-red-500 rounded-full mt-2 mr-4 flex-shrink-0 group-hover:scale-125 transition-transform duration-200"></div>
                    <span className="leading-relaxed">Log in to your JAL Virtual account to generate API key</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="w-2 h-2 bg-gradient-to-r from-red-400 to-red-500 rounded-full mt-2 mr-4 flex-shrink-0 group-hover:scale-125 transition-transform duration-200"></div>
                    <span className="leading-relaxed">Enter your API key above to access ACARS system</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="w-2 h-2 bg-gradient-to-r from-red-400 to-red-500 rounded-full mt-2 mr-4 flex-shrink-0 group-hover:scale-125 transition-transform duration-200"></div>
                    <span className="leading-relaxed">Configure your Hoppie ID in settings after login</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="w-2 h-2 bg-gradient-to-r from-red-400 to-red-500 rounded-full mt-2 mr-4 flex-shrink-0 group-hover:scale-125 transition-transform duration-200"></div>
                    <span className="leading-relaxed">Connect to ACARS network for messaging</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-5px) rotate(1deg); }
          50% { transform: translateY(-10px) rotate(0deg); }
          75% { transform: translateY(-5px) rotate(-1deg); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.6); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 1s ease-out 0.3s both;
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
