'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plane, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Clock,
  FileText,
} from 'lucide-react';
import MessagePanel from './MessagePanel';
import ACARSFeatures from './ACARSFeatures';
import SettingsPanel from './SettingsPanel';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'messages' | 'acars' | 'settings'>('messages');
  const [pilotInfo, setPilotInfo] = useState<{name: string, callsign?: string} | null>(null);
  const [isLoadingPilotInfo, setIsLoadingPilotInfo] = useState(true);
  const [zuluTime, setZuluTime] = useState(new Date());

  // Update Zulu time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setZuluTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch current pilot information from API
  useEffect(() => {
    const fetchPilotInfo = async () => {
      try {
        const token = localStorage.getItem('jal-acars-token');
        if (!token) {
          console.log('No token found');
          return;
        }

        // Use our own API route to avoid CORS issues
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: Buffer.from(token, 'base64').toString()
          }),
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log('API Response:', data);
          
          if (data.ok && data.user) {
            setPilotInfo({
              name: data.user.name || 'Pilot',
              callsign: data.user.callsign
            });
          }
        } else {
          console.log('API call failed with status:', response.status);
          const errorText = await response.text();
          console.log('Error response:', errorText);
        }
      } catch (error) {
        console.error('Failed to fetch pilot info:', error);
        // Fallback to stored user data
        if (user) {
          console.log('Using fallback user data:', user);
          setPilotInfo({
            name: user.name,
            callsign: user.callsign
          });
        }
      } finally {
        setIsLoadingPilotInfo(false);
      }
    };

    fetchPilotInfo();
  }, [user]);

  const tabs = [
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'acars', label: 'ACARS', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-xl blur-lg"></div>
                <div className="relative bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                  <Image
                    src="/img/jal-logo.png"
                    alt="JAL Logo"
                    width={32}
                    height={32}
                    className="h-8 w-auto object-contain"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.style.display = 'none';
                      const fallback = img.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'block';
                      }
                    }}
                  />
                  <Plane className="h-6 w-6 text-red-500 hidden" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ACARS Dispatch</h1>
                <p className="text-sm text-gray-400">Aircraft Communication Addressing and Reporting System</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <Clock className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-blue-400 font-medium">ZULU TIME</p>
                  <p className="text-sm text-white font-mono">
                    {zuluTime.toISOString().substr(11, 8)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-300">
                  {isLoadingPilotInfo ? 'Loading...' : 'Welcome Back'}
                </p>
                <p className="font-medium text-white">
                  {isLoadingPilotInfo ? '...' : (pilotInfo?.name || user?.name || 'Pilot')}
                </p>
                {pilotInfo?.callsign && pilotInfo.callsign !== 'JAL Dispatch' && (
                  <p className="text-xs text-gray-400">{pilotInfo.callsign}</p>
                )}
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 backdrop-blur-sm border border-gray-600/50"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-800/60 backdrop-blur-xl border-b border-gray-700/50 sticky top-[73px] z-40">
        <div className="px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'messages' | 'acars' | 'settings')}
                  className={`flex items-center space-x-2 py-4 px-6 rounded-t-lg font-medium text-sm transition-all duration-200 relative ${
                    activeTab === tab.id
                      ? 'text-white bg-gray-700/50 backdrop-blur-sm border-t-2 border-red-500'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-transparent"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative min-h-0">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 h-full">
          {activeTab === 'messages' && (
            <div className="h-full p-6">
              <div className="h-full max-w-7xl mx-auto">
                <MessagePanel />
              </div>
            </div>
          )}

          {activeTab === 'acars' && (
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">ACARS Features</h2>
                  <p className="text-gray-400">Send automated messages and reports to aircraft</p>
                </div>
                <ACARSFeatures />
              </div>
            </div>
          )}




          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
                  <p className="text-gray-400">Configure your ACARS system preferences</p>
                </div>
                <SettingsPanel />
              </div>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
