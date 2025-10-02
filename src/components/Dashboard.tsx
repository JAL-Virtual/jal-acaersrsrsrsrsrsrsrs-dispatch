'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useACARS } from '@/hooks/useACARS';
import { 
  Plane, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Send, 
  RefreshCw,
  Bell,
  FileText,
  Users,
  MapPin
} from 'lucide-react';
import MessagePanel from './MessagePanel';
import ACARSFeatures from './ACARSFeatures';
import ROPSPanel from './ROPSPanel';
import SettingsPanel from './SettingsPanel';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { messages, refreshMessages, isLoading } = useACARS();
  const [activeTab, setActiveTab] = useState<'messages' | 'acars' | 'rops' | 'settings'>('messages');

  const tabs = [
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'acars', label: 'ACARS', icon: FileText },
    { id: 'rops', label: 'ROPS ATC', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Plane className="h-8 w-8 text-red-500" />
              <div>
                <h1 className="text-xl font-bold text-white">JAL ACARS</h1>
                <p className="text-sm text-gray-400">Dispatch System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-300">Welcome back</p>
                <p className="font-medium text-white">{user?.name}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-500'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {activeTab === 'messages' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">ACARS Messages</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Bell className="h-4 w-4" />
                  <span>{messages.length} messages</span>
                </div>
                <button
                  onClick={refreshMessages}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
            <MessagePanel />
          </div>
        )}

        {activeTab === 'acars' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">ACARS Features</h2>
            <ACARSFeatures />
          </div>
        )}

        {activeTab === 'rops' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">ROPS ATC</h2>
            <ROPSPanel />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
            <SettingsPanel />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Dispatch Callsign: JALV</span>
            <span>•</span>
            <span>Hoppie ID: {user?.hoppieId || 'Not configured'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Connected to ACARS Network</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
