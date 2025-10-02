'use client';

import { useState } from 'react';
import { useACARS } from '@/hooks/useACARS';
import { useAuth } from '@/hooks/useAuth';
import { 
  FileText, 
  Send, 
  Clock, 
  Plane, 
  Fuel, 
  Users, 
  AlertTriangle,
  Zap,
  Calendar,
  MapPin,
  Cloud,
  Rocket
} from 'lucide-react';

interface ACARSFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  category: 'loadsheet' | 'report' | 'notification' | 'weather' | 'special';
}

export default function ACARSFeatures() {
  const { sendMessage } = useACARS();
  const { user } = useAuth();
  const [selectedAircraft, setSelectedAircraft] = useState('');
  const [settings, setSettings] = useState({
    autoLoadsheet: true,
    autoReports: true,
    notifications: true,
    soundEnabled: true,
    spaceLaunches: false,
    naturalDisasters: false,
    funnyMessages: false,
    specialEvents: false
  });

  const acarsFeatures: ACARSFeature[] = [
    // Loadsheet Features
    {
      id: 'preliminary-loadsheet',
      name: 'Send Preliminary Loadsheet',
      description: 'Send preliminary loadsheet with flight data before departure',
      icon: FileText,
      enabled: settings.autoLoadsheet,
      category: 'loadsheet'
    },
    {
      id: 'final-loadsheet',
      name: 'Send Final Loadsheet',
      description: 'Send final loadsheet after engine start',
      icon: FileText,
      enabled: settings.autoLoadsheet,
      category: 'loadsheet'
    },
    {
      id: 'fueling-slip',
      name: 'Send Fueling Slip',
      description: 'Send fuel dispatch after fueling completion',
      icon: Fuel,
      enabled: settings.autoReports,
      category: 'report'
    },

    // Report Features
    {
      id: 'to-report',
      name: 'Send TO Report',
      description: 'Send take-off report with performance data',
      icon: Send,
      enabled: settings.autoReports,
      category: 'report'
    },
    {
      id: 'departure-obt',
      name: 'Send Departure OBT Log',
      description: 'Confirm off-block time recording',
      icon: Clock,
      enabled: settings.autoReports,
      category: 'report'
    },
    {
      id: 'arrival-obt',
      name: 'Send Arrival OBT Log',
      description: 'Confirm arrival time logging',
      icon: Clock,
      enabled: settings.autoReports,
      category: 'report'
    },
    {
      id: 'la-report',
      name: 'Send LA Report',
      description: 'Send landing report 25 minutes before arrival',
      icon: Plane,
      enabled: settings.autoReports,
      category: 'report'
    },

    // Notification Features
    {
      id: 'connex-schedule',
      name: 'Send CONNEX Schedule',
      description: 'Send connecting flight information',
      icon: Calendar,
      enabled: settings.notifications,
      category: 'notification'
    },
    {
      id: 'ac-changes',
      name: 'Send AC Changes',
      description: 'Notify of potential aircraft changes (15% chance)',
      icon: AlertTriangle,
      enabled: settings.notifications,
      category: 'notification'
    },
    {
      id: 'crew-schedule',
      name: 'Send Crew Schedule',
      description: 'Send crew member information for next flight',
      icon: Users,
      enabled: settings.notifications,
      category: 'notification'
    },
    {
      id: 'next-leg-change',
      name: 'Send Next Leg Change',
      description: 'Notify of next leg changes (15% chance)',
      icon: AlertTriangle,
      enabled: settings.notifications,
      category: 'notification'
    },
    {
      id: 'comp-difficulties',
      name: 'Send COMP Difficulties',
      description: 'Send company operation difficulties',
      icon: AlertTriangle,
      enabled: settings.notifications,
      category: 'notification'
    },
    {
      id: 'slot-notification',
      name: 'Send Slot Notification',
      description: 'Send slot information overview',
      icon: MapPin,
      enabled: settings.notifications,
      category: 'notification'
    },

    // Special Features
    {
      id: 'space-launches',
      name: 'Send Space Launches',
      description: 'Notify of spacecraft launches within 300 NM',
      icon: Rocket,
      enabled: settings.spaceLaunches,
      category: 'special'
    },
    {
      id: 'natural-disasters',
      name: 'Send Natural Disasters',
      description: 'Notify of storms, earthquakes, volcanoes within 300 NM',
      icon: Cloud,
      enabled: settings.naturalDisasters,
      category: 'special'
    },
    {
      id: 'funny-messages',
      name: 'Send Funny Messages',
      description: 'Send humorous messages (German humor)',
      icon: Zap,
      enabled: settings.funnyMessages,
      category: 'special'
    },
    {
      id: 'special-events',
      name: 'Send Special Events',
      description: 'Send relevant special event notifications',
      icon: Calendar,
      enabled: settings.specialEvents,
      category: 'special'
    }
  ];

  const handleSendFeature = async (feature: ACARSFeature) => {
    if (!selectedAircraft) {
      alert('Please select an aircraft first');
      return;
    }

    const messageContent = generateMessageContent(feature.id);
    
    await sendMessage({
      from: user?.callsign || 'JALV',
      to: selectedAircraft,
      type: 'telex',
      packet: messageContent
    });
  };

  const generateMessageContent = (featureId: string): string => {
    const templates: Record<string, string> = {
      'preliminary-loadsheet': 'PRELIMINARY LOADSHEET\nAIRCRAFT: B777-300ER\nPAX: 350\nCARGO: 15000KG\nFUEL: 145000KG\nCAPTAIN: TANAKA\nFO: SUZUKI',
      'final-loadsheet': 'FINAL LOADSHEET\nAIRCRAFT: B777-300ER\nPAX: 348\nCARGO: 15200KG\nFUEL: 144500KG\nZFW: 180000KG\nTOW: 328500KG',
      'to-report': 'TO PERFORMANCE REPORT\nRWY: 16R\nV1: 155\nVR: 158\nV2: 163\nFLAPS: 15\nENGINE START: 1456Z',
      'departure-obt': 'DEPARTURE OBT LOG\nOFF-BLOCK TIME: 1456Z\nCONFIRMED AND RECORDED',
      'arrival-obt': 'ARRIVAL OBT LOG\nON-BLOCK TIME: 0834Z\nCONFIRMED AND RECORDED',
      'la-report': 'LANDING REPORT\nRWY: 34L\nAPPROACH: ILS\nWIND: 280/12\nVISIBILITY: 10KM\nLANDING TIME: 0834Z',
      'fueling-slip': 'FUELING SLIP\nFUEL LOADED: 144500KG\nFUEL TYPE: JET-A1\nFUELING COMPLETED: 1420Z',
      'connex-schedule': 'CONNEX SCHEDULE\nCONNECTING FLIGHTS AVAILABLE\nCHECK GATE ASSIGNMENTS',
      'ac-changes': 'AIRCRAFT CHANGE NOTIFICATION\nNEW AIRCRAFT: B787-9\nREASON: MAINTENANCE',
      'crew-schedule': 'CREW SCHEDULE\nCAPTAIN: TANAKA (CONTINUING)\nFO: SUZUKI (CONTINUING)\nFA: YAMADA (CONTINUING)',
      'next-leg-change': 'NEXT LEG CHANGE\nNEW ROUTE: RJAA-RJTT\nREASON: WEATHER',
      'comp-difficulties': 'COMPANY DIFFICULTIES\nGROUND DELAY PROGRAM IN EFFECT\nEXPECT 30 MIN DELAY',
      'slot-notification': 'SLOT NOTIFICATION\nORIGIN: RJAA\nDESTINATION: RJTT\nEOBT: 1500Z\nCONFIRM DETAILS',
      'space-launches': 'SPACE LAUNCH NOTIFICATION\nLAUNCH SITE: TANEGASHIMA\nTIME: 1600Z\nAVOID AREA: 300NM RADIUS',
      'natural-disasters': 'NATURAL DISASTER ALERT\nTYPHOON APPROACHING\nPOSITION: 35N 140E\nAVOID AREA: 300NM RADIUS',
      'funny-messages': 'FUNNY MESSAGE\nWHY DID THE PILOT CROSS THE ROAD?\nTO GET TO THE OTHER SIDE OF THE RUNWAY!',
      'special-events': 'SPECIAL EVENT\nWORLD CUP FINAL TODAY\nEXPECT INCREASED TRAFFIC'
    };

    return templates[featureId] || 'ACARS MESSAGE';
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'loadsheet': return 'bg-blue-900/20 text-blue-400 border-blue-500';
      case 'report': return 'bg-green-900/20 text-green-400 border-green-500';
      case 'notification': return 'bg-yellow-900/20 text-yellow-400 border-yellow-500';
      case 'weather': return 'bg-purple-900/20 text-purple-400 border-purple-500';
      case 'special': return 'bg-red-900/20 text-red-400 border-red-500';
      default: return 'bg-gray-900/20 text-gray-400 border-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Aircraft Selection */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Aircraft Selection</h3>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={selectedAircraft}
            onChange={(e) => setSelectedAircraft(e.target.value.toUpperCase())}
            placeholder="Enter aircraft callsign (e.g., JAL123)"
            className="px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-400">Selected: {selectedAircraft || 'None'}</span>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">ACARS Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(settings).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value}
                onChange={() => toggleSetting(key as keyof typeof settings)}
                className="rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-gray-300 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ACARS Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {acarsFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.id}
              className={`bg-gray-800 rounded-lg border border-gray-700 p-4 transition-all hover:border-gray-600 ${
                !feature.enabled ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-gray-400" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(feature.category)}`}>
                    {feature.category}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  feature.enabled ? 'bg-green-900/20 text-green-400' : 'bg-gray-900/20 text-gray-400'
                }`}>
                  {feature.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <h4 className="font-medium text-white mb-2">{feature.name}</h4>
              <p className="text-sm text-gray-400 mb-4">{feature.description}</p>
              
              <button
                onClick={() => handleSendFeature(feature)}
                disabled={!feature.enabled || !selectedAircraft}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Send className="h-4 w-4" />
                <span>Send</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
