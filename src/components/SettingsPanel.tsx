'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Settings, 
  User, 
  Radio, 
  Bell, 
  Moon, 
  Sun,
  Save,
  RefreshCw,
  Trash2
} from 'lucide-react';

export default function SettingsPanel() {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState({
    simbriefId: user?.simbriefId || '',
    autoLoadsheet: true,
    autoReports: true,
    notifications: true,
    soundEnabled: true,
    theme: 'dark' as 'light' | 'dark',
    refreshInterval: 30,
    spaceLaunches: true,
    naturalDisasters: true,
    specialEvents: true
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('jal-acars-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Update settings when user data changes
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        simbriefId: user.simbriefId || prev.simbriefId,
      }));
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Update user data
    if (settings.simbriefId !== user?.simbriefId) {
      updateUser({
        simbriefId: settings.simbriefId
      });
    }

    // Settings are already saved to localStorage via updateSetting
    // Just show success message
    setTimeout(() => {
      setIsSaving(false);
      alert('Settings saved successfully!');
    }, 500);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings = {
        simbriefId: '',
        autoLoadsheet: true,
        autoReports: true,
        notifications: true,
        soundEnabled: true,
        theme: 'dark' as 'light' | 'dark',
        refreshInterval: 30,
        spaceLaunches: true,
        naturalDisasters: true,
        specialEvents: true
      };
      setSettings(defaultSettings);
      localStorage.setItem('jal-acars-settings', JSON.stringify(defaultSettings));
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all message data? This cannot be undone.')) {
      localStorage.removeItem('jal-acars-messages');
      alert('Message data cleared successfully!');
    }
  };

  const updateSetting = (key: keyof typeof settings, value: boolean | string | number) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      // Auto-save to localStorage when settings change
      localStorage.setItem('jal-acars-settings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  return (
    <div className="space-y-6">
      {/* User Settings */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <User className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">User Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="simbriefId" className="block text-sm font-medium text-gray-300 mb-1">
              SimBrief User ID
            </label>
            <input
              id="simbriefId"
              type="text"
              value={settings.simbriefId}
              onChange={(e) => updateSetting('simbriefId', e.target.value)}
              placeholder="Enter your SimBrief User ID"
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              Required for Loadsheet functions (Preliminary & Final)
            </p>
          </div>
        </div>
      </div>

      {/* ACARS Settings */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Radio className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">ACARS Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300">Message Settings</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.autoLoadsheet}
                  onChange={(e) => updateSetting('autoLoadsheet', e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-gray-300">Auto Loadsheet</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.autoReports}
                  onChange={(e) => updateSetting('autoReports', e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-gray-300">Auto Reports</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => updateSetting('notifications', e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-gray-300">Notifications</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300">Special Features</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.spaceLaunches}
                  onChange={(e) => updateSetting('spaceLaunches', e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-gray-300">Space Launches</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.naturalDisasters}
                  onChange={(e) => updateSetting('naturalDisasters', e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-gray-300">Natural Disasters</span>
              </label>
              
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.specialEvents}
                  onChange={(e) => updateSetting('specialEvents', e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-gray-300">Special Events</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Interface Settings */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Interface Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="refreshInterval" className="block text-sm font-medium text-gray-300 mb-1">
                Message Refresh Interval (seconds)
              </label>
              <input
                id="refreshInterval"
                type="number"
                min="10"
                max="300"
                value={settings.refreshInterval}
                onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-gray-300">Sound Notifications</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => updateSetting('theme', 'light')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                    settings.theme === 'light' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => updateSetting('theme', 'dark')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                    settings.theme === 'dark' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pilot Connection Instructions */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Pilot Connection Instructions</h3>
        </div>
        
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h4 className="font-medium text-white mb-2">For Pilots to Connect:</h4>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Obtain your Hoppie ID from the Hoppie ACARS website</li>
              <li>Configure your flight simulator ACARS system with your Hoppie ID</li>
              <li>Set your callsign in the ACARS system</li>
              <li>Connect to the ACARS network</li>
              <li>You will receive messages from Dispatch Callsign: JALV</li>
            </ol>
          </div>
          
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-xs text-gray-400">
              <strong>Note:</strong> Dispatch Hoppie ID and Callsign are configured via environment variables. Pilots need to configure their own Hoppie ID in their flight simulator ACARS system for proper communication.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset Settings</span>
          </button>
          
          <button
            onClick={handleClearData}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Data</span>
          </button>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
}
