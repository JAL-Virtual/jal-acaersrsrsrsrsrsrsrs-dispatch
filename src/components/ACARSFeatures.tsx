'use client';

import { useState, useEffect } from 'react';
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
  Rocket,
  Play,
  Pause,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Edit3,
  Save,
  X,
  ChevronDown
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
  const { sendMessage, messages } = useACARS();
  const { user } = useAuth();
  const [selectedAircraft, setSelectedAircraft] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState('');
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoRunProgress, setAutoRunProgress] = useState(0);
  const [completedFeatures, setCompletedFeatures] = useState<string[]>([]);
  const [detectedCallsigns, setDetectedCallsigns] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [settings, setSettings] = useState({
    autoLoadsheet: true,
    autoReports: true,
    notifications: true,
    soundEnabled: true,
    spaceLaunches: true,
    naturalDisasters: true,
    specialEvents: true
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
      id: 'special-events',
      name: 'Send Special Events',
      description: 'Send relevant special event notifications',
      icon: Calendar,
      enabled: settings.specialEvents,
      category: 'special'
    }
  ];

  // Auto-run all features when callsign is entered and user is JALV
  useEffect(() => {
    if (selectedAircraft && user?.callsign === 'JALV' && !isAutoRunning) {
      startAutoRun();
    }
  }, [selectedAircraft, user?.callsign]);

  // Detect callsigns from messages
  useEffect(() => {
    const callsigns = new Set<string>();
    
    messages.forEach(message => {
      if (message.from && message.from !== 'JALV' && message.from !== user?.callsign) {
        callsigns.add(message.from);
      }
    });
    
    setDetectedCallsigns(Array.from(callsigns).sort());
  }, [messages, user?.callsign]);

  // Get enabled features only
  const enabledFeatures = acarsFeatures.filter(feature => feature.enabled);

  const startAutoRun = async () => {
    if (!selectedAircraft || user?.callsign !== 'JALV') {
      return;
    }

    setIsAutoRunning(true);
    setAutoRunProgress(0);
    setCompletedFeatures([]);

    for (let i = 0; i < enabledFeatures.length; i++) {
      const feature = enabledFeatures[i];
      
      try {
        const messageContent = generateMessageContent(feature.id);
        
        await sendMessage({
          from: user?.callsign || 'JALV',
          to: selectedAircraft,
          type: 'telex',
          packet: messageContent
        });

        setCompletedFeatures(prev => [...prev, feature.id]);
        setAutoRunProgress(((i + 1) / enabledFeatures.length) * 100);

        // Add delay between messages to avoid overwhelming the system
        if (i < enabledFeatures.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
      } catch (error) {
        console.error(`Failed to send ${feature.name}:`, error);
      }
    }

    setIsAutoRunning(false);
  };

  const stopAutoRun = () => {
    setIsAutoRunning(false);
    setAutoRunProgress(0);
  };


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

  const handleSendEditedMessage = async () => {
    if (!selectedAircraft || !editedMessage.trim()) {
      alert('Please select an aircraft and enter a message');
      return;
    }

    await sendMessage({
      from: user?.callsign || 'JALV',
      to: selectedAircraft,
      type: 'telex',
      packet: editedMessage
    });

    setIsEditing(false);
    setEditedMessage('');
    setSelectedFeature('');
  };

  const startEditing = (featureId: string) => {
    const message = generateMessageContent(featureId);
    setSelectedFeature(featureId);
    setEditedMessage(message);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedMessage('');
    setSelectedFeature('');
  };

  const selectFeature = (featureId: string) => {
    setSelectedFeature(featureId);
    setIsDropdownOpen(false);
  };

  const getSelectedFeature = () => {
    return acarsFeatures.find(f => f.id === selectedFeature);
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
            disabled={isAutoRunning}
          />
          <span className="text-sm text-gray-400">Selected: {selectedAircraft || 'None'}</span>
        </div>

        {/* Detected Callsigns */}
        {detectedCallsigns.length > 0 && (
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Detected Callsigns</span>
              <span className="text-xs text-gray-400">({detectedCallsigns.length} found)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {detectedCallsigns.map((callsign) => (
                <button
                  key={callsign}
                  onClick={() => setSelectedAircraft(callsign)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    selectedAircraft === callsign
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600/50 hover:border-gray-500'
                  }`}
                  disabled={isAutoRunning}
                >
                  {callsign}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Click on a callsign to select it for ACARS messaging
            </p>
          </div>
        )}
        
        {/* Auto-run Status */}
        {user?.callsign === 'JALV' && (
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">Auto-Run Mode</span>
              </div>
              {isAutoRunning ? (
                <button
                  onClick={stopAutoRun}
                  className="flex items-center space-x-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                >
                  <Pause className="h-3 w-3" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={startAutoRun}
                  disabled={!selectedAircraft}
                  className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs disabled:opacity-50"
                >
                  <Play className="h-3 w-3" />
                  <span>Start</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-2">
              All enabled ACARS features will automatically run when a callsign is entered
            </p>
            {isAutoRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-blue-400">{Math.round(autoRunProgress)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${autoRunProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400">
                  Completed: {completedFeatures.length} / {enabledFeatures.length}
                </div>
              </div>
            )}
          </div>
        )}
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

      {/* Message Editor */}
      {isEditing && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Edit Message</h3>
            <button
              onClick={cancelEditing}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message Content
              </label>
              <textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                className="w-full h-40 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter your ACARS message..."
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Sending to: <span className="text-white font-mono">{selectedAircraft || 'No aircraft selected'}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEditedMessage}
                  disabled={!selectedAircraft || !editedMessage.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Function Selection */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Select ACARS Function</h3>
        
        {/* Dropdown Selector */}
        <div className="relative mb-4">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {getSelectedFeature() ? (
                <>
                  <getSelectedFeature().icon className="h-5 w-5 text-gray-400" />
                  <span>{getSelectedFeature().name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(getSelectedFeature().category)}`}>
                    {getSelectedFeature().category}
                  </span>
                </>
              ) : (
                <span className="text-gray-400">Choose an ACARS function...</span>
              )}
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {enabledFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.id}
                    onClick={() => selectFeature(feature.id)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-600 transition-colors border-b border-gray-600 last:border-b-0"
                  >
                    <Icon className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-white font-medium">{feature.name}</div>
                      <div className="text-sm text-gray-400">{feature.description}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(feature.category)}`}>
                      {feature.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Feature Actions */}
        {getSelectedFeature() && (
          <div className="space-y-4">
            {/* Feature Details */}
            <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600/50">
              <div className="flex items-center space-x-2 mb-2">
                <getSelectedFeature().icon className="h-5 w-5 text-gray-400" />
                <h4 className="font-medium text-white">{getSelectedFeature().name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(getSelectedFeature().category)}`}>
                  {getSelectedFeature().category}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-3">{getSelectedFeature().description}</p>
              
              {/* Message Preview */}
              <div className="bg-gray-900/50 rounded p-3 border border-gray-700/50">
                <h5 className="text-xs font-medium text-gray-300 mb-2">Message Preview:</h5>
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                  {generateMessageContent(getSelectedFeature().id)}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => handleSendFeature(getSelectedFeature())}
                disabled={!selectedAircraft || isAutoRunning}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completedFeatures.includes(getSelectedFeature().id) ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                <span>
                  {completedFeatures.includes(getSelectedFeature().id) ? 'Sent' : 'Send'}
                </span>
              </button>
              
              <button
                onClick={() => startEditing(getSelectedFeature().id)}
                disabled={isAutoRunning}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit3 className="h-5 w-5" />
                <span>Edit & Send</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
