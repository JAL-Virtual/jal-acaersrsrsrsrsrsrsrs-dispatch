'use client';

import { useState, useEffect, useCallback } from 'react';
import { useACARS } from '@/hooks/useACARS';
import { useAuth } from '@/hooks/useAuth';
import { SimBriefAPI, SimBriefFlightPlan } from '@/lib/simbrief';
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
  Edit3,
  X,
  Radio,
  Settings,
  RefreshCw
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
  
  // Debug: Log user object to see what's available
  console.log('ACARSFeatures - User object:', user);
  console.log('ACARSFeatures - SimBrief ID:', user?.simbriefId);
  const [selectedAircraft, setSelectedAircraft] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState('');
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoRunProgress, setAutoRunProgress] = useState(0);
  const [completedFeatures, setCompletedFeatures] = useState<string[]>([]);
  const [detectedCallsigns, setDetectedCallsigns] = useState<string[]>([]);
  const [simbriefData, setSimbriefData] = useState<SimBriefFlightPlan | null>(null);
  const [isLoadingSimbrief, setIsLoadingSimbrief] = useState(false);
  const [simbriefError, setSimbriefError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
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
      id: 'loadsheet',
      name: 'Send Loadsheet',
      description: 'Send loadsheet with flight data (Preliminary or Final based on SimBrief data)',
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

  // Get enabled features only
  const enabledFeatures = acarsFeatures.filter(feature => feature.enabled);

  // Fetch SimBrief data
  const fetchSimbriefData = useCallback(async () => {
    if (!user?.simbriefId) {
      setSimbriefError('SimBrief ID not configured');
      return;
    }

    setIsLoadingSimbrief(true);
    setSimbriefError(null);

    try {
      const simbriefAPI = new SimBriefAPI(user.simbriefId);
      const flightPlan = await simbriefAPI.fetchLatestFlightPlan();
      setSimbriefData(flightPlan);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error fetching SimBrief data:', error);
      setSimbriefError(error instanceof Error ? error.message : 'Failed to fetch SimBrief data');
    } finally {
      setIsLoadingSimbrief(false);
    }
  }, [user?.simbriefId]);

  const generateMessageContent = useCallback((featureId: string): string => {
    // Use SimBrief data if available and SimBrief ID is configured
    if (user?.simbriefId && simbriefData && featureId === 'loadsheet') {
      console.log('Using SimBrief data for loadsheet:', simbriefData);
      const simbriefAPI = new SimBriefAPI(user.simbriefId);
      // Determine if it's preliminary or final based on flight status
      const loadsheetType = 'preliminary'; // Default to preliminary
      const loadsheetContent = simbriefAPI.formatLoadsheet(simbriefData, loadsheetType) + '\nACARS END';
      console.log('Generated loadsheet content:', loadsheetContent);
      return loadsheetContent;
    }
    console.log('Using fallback template for loadsheet. SimBrief ID:', user?.simbriefId, 'SimBrief Data:', simbriefData);

    const templates: Record<string, string> = {
      'loadsheet': 'LOAD SHEET\nFLIGHT: JAL123\nAIRCRAFT: B777-300ER\nPASSENGERS: 250\nCARGO: 5000KG\nFUEL: 120000LBS\nACARS END',
      'weather': 'WEATHER REPORT\nDESTINATION: RJTT\nCONDITIONS: CLEAR\nWIND: 270/10KT\nVISIBILITY: 10SM\nACARS END',
      'notam': 'NOTAM ALERT\nRJTT RWY 16R/34L CLOSED\nDURATION: 1200Z-1800Z\nUSE RWY 16L/34R\nACARS END',
      'position': 'POSITION REPORT\nLAT: 35.6762N\nLON: 139.6503E\nALT: FL350\nSPEED: 480KT\nACARS END',
      'fuel': 'FUEL REPORT\nCURRENT: 80000LBS\nREMAINING: 60000LBS\nCONSUMPTION: 20000LBS\nACARS END',
      'passenger': 'PASSENGER COUNT\nTOTAL: 250\nBUSINESS: 20\nECONOMY: 230\nACARS END',
      'cargo': 'CARGO REPORT\nTOTAL WEIGHT: 5000KG\nCONTAINERS: 5\nSPECIAL: 2\nACARS END',
      'maintenance': 'MAINTENANCE ALERT\nENGINE 1: NORMAL\nENGINE 2: NORMAL\nHYDRAULIC: NORMAL\nACARS END',
      'emergency': 'EMERGENCY ALERT\nTYPE: MEDICAL\nSEVERITY: MINOR\nREQUIRE: AMBULANCE\nACARS END',
      'delay': 'DELAY NOTIFICATION\nREASON: WEATHER\nDURATION: 30MIN\nNEW DEP: 1400Z\nACARS END',
      'space-launches': 'SPACE LAUNCH NOTIFICATION\nLAUNCH SITE: TANEGASHIMA\nTIME: 1600Z\nAVOID AREA: 300NM RADIUS\nACARS END',
      'natural-disasters': 'NATURAL DISASTER ALERT\nTYPHOON APPROACHING\nPOSITION: 35N 140E\nAVOID AREA: 300NM RADIUS\nACARS END',
      'special-events': 'SPECIAL EVENT\nWORLD CUP FINAL TODAY\nEXPECT INCREASED TRAFFIC\nACARS END'
    };

    return templates[featureId] || 'ACARS MESSAGE\nACARS END';
  }, [user?.simbriefId, simbriefData]);

  const startAutoRun = useCallback(async () => {
    if (!selectedAircraft) {
      return;
    }

    // Allow sending to any aircraft - let Hoppie API handle delivery
    // The detectedCallsigns list is just for convenience, not a requirement

    setIsAutoRunning(true);
    setAutoRunProgress(0);
    setCompletedFeatures([]);

    for (let i = 0; i < enabledFeatures.length; i++) {
      const feature = enabledFeatures[i];
      
      try {
        // If it's a loadsheet feature, sync with SimBrief first
        if (feature.id === 'loadsheet' && user?.simbriefId) {
          try {
            await fetchSimbriefData();
          } catch (error) {
            console.error('Failed to sync with SimBrief:', error);
            // Continue with sending even if sync fails
          }
        }

        const messageContent = generateMessageContent(feature.id);
        
        await sendMessage({
          from: process.env.DISPATCH_CALLSIGN || 'JALV',
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
  }, [selectedAircraft, enabledFeatures, sendMessage, fetchSimbriefData, user?.simbriefId, generateMessageContent]);

  const stopAutoRun = () => {
    setIsAutoRunning(false);
    setAutoRunProgress(0);
  };

  // Auto-run all features when callsign is entered and user is JALV
  useEffect(() => {
    if (selectedAircraft && user?.callsign === 'JALV' && !isAutoRunning) {
      startAutoRun();
    }
  }, [selectedAircraft, user?.callsign, isAutoRunning, startAutoRun]);

  // Detect callsigns from messages
  useEffect(() => {
    const callsigns = new Set<string>();
    
    messages.forEach(message => {
      // Include all aircraft callsigns except JALV dispatch
      // If user is logged in as JALV, include all aircraft
      // If user is a pilot, include all aircraft except their own
      if (message.from && message.from !== 'JALV') {
        if (user?.callsign === 'JALV' || message.from !== user?.callsign) {
          callsigns.add(message.from);
        }
      }
    });
    
    setDetectedCallsigns(Array.from(callsigns).sort());
  }, [messages, user?.callsign]);

  const handleSendFeature = async (feature: ACARSFeature) => {
    if (!selectedAircraft) {
      alert('Please select an aircraft first');
      return;
    }

    // If it's a loadsheet feature, sync with SimBrief first
    if (feature.id === 'loadsheet' && user?.simbriefId) {
      try {
        await fetchSimbriefData();
      } catch (error) {
        console.error('Failed to sync with SimBrief:', error);
        // Continue with sending even if sync fails
      }
    }

    // Allow sending to any aircraft - let Hoppie API handle delivery
    // The detectedCallsigns list is just for convenience, not a requirement

    const messageContent = generateMessageContent(feature.id);
    
    await sendMessage({
      from: process.env.DISPATCH_CALLSIGN || 'JALV',
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

    // Allow sending to any aircraft - let Hoppie API handle delivery
    // The detectedCallsigns list is just for convenience, not a requirement

    await sendMessage({
      from: process.env.DISPATCH_CALLSIGN || 'JALV',
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
    // Toggle selection - if already selected, deselect it
    if (selectedFeature === featureId) {
      setSelectedFeature('');
    } else {
      setSelectedFeature(featureId);
    }
  };

  const getSelectedFeature = () => {
    return acarsFeatures.find(f => f.id === selectedFeature);
  };

  // Auto-sync SimBrief data when component mounts or SimBrief ID changes
  useEffect(() => {
    if (user?.simbriefId) {
      fetchSimbriefData();
    }
  }, [user?.simbriefId, fetchSimbriefData]);

  // Auto-refresh SimBrief data every 5 minutes
  useEffect(() => {
    if (!user?.simbriefId) return;

    const interval = setInterval(() => {
      fetchSimbriefData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user?.simbriefId, fetchSimbriefData]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-600/20 to-blue-600/20 backdrop-blur-xl border-b border-gray-700/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-xl blur-lg"></div>
                <div className="relative bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                  <Radio className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ACARS Dispatch</h1>
                <p className="text-gray-400">Aircraft Communication Addressing and Reporting System</p>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">Connected</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <Plane className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-blue-400">{detectedCallsigns.length} Aircraft</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Quick Actions Bar */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
          <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Plane className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Target Aircraft:</span>
          <input
            type="text"
            value={selectedAircraft}
            onChange={(e) => setSelectedAircraft(e.target.value.toUpperCase())}
                  placeholder="Enter callsign..."
                  className="px-3 py-1 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  disabled={isAutoRunning}
                />
              </div>
              
              {selectedAircraft && (
                <div className="flex items-center space-x-2 px-2 py-1 bg-green-900/20 border border-green-500/30 rounded">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">{selectedAircraft}</span>
                </div>
              )}
            </div>

            {/* Auto-run Controls */}
            {user?.callsign === 'JALV' && (
              <div className="flex items-center space-x-2">
                {isAutoRunning ? (
                  <>
                    <div className="flex items-center space-x-2 px-3 py-1 bg-red-900/20 border border-red-500/30 rounded">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-red-400">Auto-Running</span>
                    </div>
                    <button
                      onClick={stopAutoRun}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                    >
                      <Pause className="h-3 w-3" />
                      <span>Stop</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startAutoRun}
                    disabled={!selectedAircraft}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors disabled:opacity-50"
                  >
                    <Play className="h-3 w-3" />
                    <span>Auto-Run</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isAutoRunning && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Progress</span>
                <span className="text-blue-400">{Math.round(autoRunProgress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${autoRunProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-400">
                Completed: {completedFeatures.length} / {enabledFeatures.length} features
              </div>
            </div>
          )}
        </div>

        {/* Detected Aircraft */}
        {detectedCallsigns.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Aircraft Logged to JALV</span>
              <span className="text-xs text-gray-400">({detectedCallsigns.length} detected)</span>
            </div>
            <div className="mb-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300">
                <strong>Note:</strong> Aircraft that have communicated with JALV dispatch (for convenience)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {detectedCallsigns.map((callsign) => (
                <button
                  key={callsign}
                  onClick={() => setSelectedAircraft(callsign)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                    selectedAircraft === callsign
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25'
                      : 'bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600/50 hover:border-gray-500 hover:shadow-md'
                  }`}
                  disabled={isAutoRunning}
                >
                  {callsign}
                </button>
              ))}
        </div>
      </div>
        )}

        {/* Settings Panel */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">ACARS Settings</h3>
      </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(settings).map(([key, value]) => (
              <label key={key} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700/30 transition-colors">
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

        {/* SimBrief Sync Section */}
        {user?.simbriefId && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Plane className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">SimBrief Integration</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Auto-sync enabled</span>
                </div>
              </div>
              <button
                onClick={fetchSimbriefData}
                disabled={isLoadingSimbrief}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoadingSimbrief ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh Data</span>
                  </>
                )}
              </button>
            </div>
            
            {simbriefError && (
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-400">{simbriefError}</span>
                </div>
              </div>
            )}
            
            {simbriefData && (
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">SimBrief Data Loaded</span>
                  </div>
                  {lastSyncTime && (
                    <span className="text-xs text-gray-400">
                      Last sync: {lastSyncTime.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-300">
                  Flight: {simbriefData.general.callsign} | 
                  Route: {simbriefData.general.origin.icao_code} → {simbriefData.general.destination.icao_code} | 
                  Aircraft: {simbriefData.general.aircraft.name} | 
                  PAX: {simbriefData.general.weights.passenger_count}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Function Selection */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">ACARS Functions</h3>
          </div>
          
          {/* Function Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {enabledFeatures.map((feature) => {
          const Icon = feature.icon;
              const isSelected = selectedFeature === feature.id;
              const requiresSimBrief = feature.id === 'loadsheet';
              const hasSimBriefId = user?.simbriefId?.trim() !== '';
              const isDisabled = requiresSimBrief && !hasSimBriefId;
              
          return (
                <button
              key={feature.id}
                  onClick={() => !isDisabled && selectFeature(feature.id)}
                  disabled={isDisabled}
                  className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-600/30 to-purple-600/20 border-blue-400 shadow-xl shadow-blue-500/25 scale-105'
                      : isDisabled
                      ? 'bg-gray-800/30 border-gray-700 opacity-50 cursor-not-allowed'
                      : 'bg-gradient-to-br from-gray-700/40 to-gray-800/40 border-gray-600 hover:from-gray-600/50 hover:to-gray-700/50 hover:border-gray-500 hover:scale-102 hover:shadow-lg'
                  }`}
                >
                  {/* Background glow effect for selected */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl"></div>
                  )}
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 animate-pulse"></div>
                    </div>
                  )}
                  
                  {/* SimBrief requirement indicator */}
                  {requiresSimBrief && !hasSimBriefId && (
                    <div className="absolute top-3 right-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50" title="Requires SimBrief ID"></div>
                    </div>
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className={`p-2 rounded-lg transition-colors ${
                        isSelected 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : isDisabled 
                          ? 'bg-gray-700/50 text-gray-600' 
                          : 'bg-gray-600/50 text-gray-400 group-hover:bg-gray-500/50 group-hover:text-gray-300'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${getCategoryColor(feature.category)}`}>
                        {feature.category}
                      </span>
                    </div>
                    
                    <h4 className={`text-sm font-semibold mb-2 transition-colors ${
                      isSelected 
                        ? 'text-white' 
                        : isDisabled 
                        ? 'text-gray-500' 
                        : 'text-gray-200 group-hover:text-white'
                    }`}>
                      {feature.name}
                    </h4>
                    
                    <p className={`text-xs leading-relaxed transition-colors ${
                      isSelected 
                        ? 'text-gray-300' 
                        : isDisabled 
                        ? 'text-gray-600' 
                        : 'text-gray-400 group-hover:text-gray-300'
                    }`}>
                      {feature.description}
                    </p>
                    
                    {/* SimBrief warning */}
                    {requiresSimBrief && !hasSimBriefId && (
                      <div className="mt-3 p-2 bg-red-900/30 border border-red-500/40 rounded-lg">
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3 text-red-400" />
                          <span className="text-xs text-red-300 font-medium">Requires SimBrief ID</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Selection feedback */}
                    {isSelected && (
                      <div className="mt-3 flex items-center space-x-1 text-xs text-blue-300">
                        <CheckCircle className="h-3 w-3" />
                        <span>Selected</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Hover effect overlay */}
                  {!isSelected && !isDisabled && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Feature Actions */}
          {getSelectedFeature() && (
            <div className="space-y-4">
              {/* Feature Details */}
              <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/50 backdrop-blur-sm">
                {(() => {
                  const feature = getSelectedFeature();
                  if (!feature) return null;
                  const Icon = feature.icon;
                  return (
                    <>
                      <div className="flex items-center space-x-2 mb-2">
                  <Icon className="h-5 w-5 text-gray-400" />
                        <h4 className="font-medium text-white">{feature.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(feature.category)}`}>
                    {feature.category}
                  </span>
                </div>
                      <p className="text-sm text-gray-400 mb-3">{feature.description}</p>
                      
                      {/* Message Preview */}
                      <div className="bg-gray-900/50 rounded p-3 border border-gray-700/50">
                        <h5 className="text-xs font-medium text-gray-300 mb-2">Message Preview:</h5>
                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                          {generateMessageContent(feature.id)}
                        </pre>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                {(() => {
                  const feature = getSelectedFeature();
                  if (!feature) return null;
                  const requiresSimBrief = feature.id === 'loadsheet';
                  const hasSimBriefId = user?.simbriefId?.trim() !== '';
                  const isSimBriefDisabled = requiresSimBrief && !hasSimBriefId;
                  
                  return (
                    <>
              <button
                onClick={() => handleSendFeature(feature)}
                        disabled={!selectedAircraft || isAutoRunning || isSimBriefDisabled}
                        className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25"
                      >
                        {completedFeatures.includes(feature.id) ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                        <span>
                          {completedFeatures.includes(feature.id) ? 'Sent' : 'Send'}
                        </span>
                      </button>
                      
                      <button
                        onClick={() => startEditing(feature.id)}
                        disabled={isAutoRunning || isSimBriefDisabled}
                        className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                      >
                        <Edit3 className="h-5 w-5" />
                        <span>Edit & Send</span>
                      </button>
                    </>
                  );
                })()}
              </div>
              
              {/* SimBrief Warning */}
              {(() => {
                const feature = getSelectedFeature();
                if (!feature) return null;
                const requiresSimBrief = feature.id === 'loadsheet';
                const hasSimBriefId = user?.simbriefId?.trim() !== '';
                
                if (requiresSimBrief && !hasSimBriefId) {
                  return (
                    <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span className="text-sm text-red-400 font-medium">SimBrief ID Required</span>
                      </div>
                      <p className="text-xs text-red-300 mt-1">
                        Please enter your SimBrief User ID in the settings above to use this function.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>

        {/* Message Editor */}
        {isEditing && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Message Editor</h3>
              </div>
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
                  className="w-full h-40 px-4 py-3 border border-gray-600 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm backdrop-blur-sm"
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
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEditedMessage}
                    disabled={!selectedAircraft || !editedMessage.trim()}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                    <span>Send Message</span>
              </button>
            </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
