'use client';

import { useState } from 'react';
import { useACARS } from '@/hooks/useACARS';
import { useAuth } from '@/hooks/useAuth';
import { 
  Radio, 
  Send, 
  ArrowUp, 
  ArrowDown, 
  Navigation,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin
} from 'lucide-react';

interface ROPSRequest {
  id: string;
  type: 'pdc' | 'cpdlc' | 'direct' | 'level' | 'speed' | 'oceanic';
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
  details: string;
}

export default function ROPSPanel() {
  const { sendMessage } = useACARS();
  const { user } = useAuth();
  const [selectedAircraft, setSelectedAircraft] = useState('');
  const [requests, setRequests] = useState<ROPSRequest[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const ropsFeatures = [
    {
      id: 'pdc',
      name: 'Pre-Departure Clearance (PDC)',
      description: 'Request PDC from ROPS station',
      icon: Radio,
      color: 'bg-blue-900/20 text-blue-400 border-blue-500'
    },
    {
      id: 'cpdlc',
      name: 'CPDLC Logon',
      description: 'Log onto ROPS station for CPDLC',
      icon: CheckCircle,
      color: 'bg-green-900/20 text-green-400 border-green-500'
    },
    {
      id: 'direct',
      name: 'Direct To Instructions',
      description: 'Request direct routing instructions',
      icon: Navigation,
      color: 'bg-purple-900/20 text-purple-400 border-purple-500'
    },
    {
      id: 'level',
      name: 'Flight Level Request',
      description: 'Request altitude changes',
      icon: ArrowUp,
      color: 'bg-yellow-900/20 text-yellow-400 border-yellow-500'
    },
    {
      id: 'speed',
      name: 'Speed Request',
      description: 'Request speed adjustments',
      icon: ArrowDown,
      color: 'bg-orange-900/20 text-orange-400 border-orange-500'
    },
    {
      id: 'oceanic',
      name: 'Oceanic Clearance',
      description: 'Request oceanic clearance',
      icon: MapPin,
      color: 'bg-red-900/20 text-red-400 border-red-500'
    }
  ];

  const handleROPSRequest = async (featureId: string) => {
    if (!selectedAircraft) {
      alert('Please select an aircraft first');
      return;
    }

    const requestContent = generateRequestContent(featureId);
    
    // Add request to local state
    const newRequest: ROPSRequest = {
      id: Date.now().toString(),
      type: featureId as 'pdc' | 'cpdlc' | 'oceanic' | 'direct',
      status: 'pending',
      timestamp: new Date(),
      details: requestContent
    };
    
    setRequests(prev => [newRequest, ...prev]);

    // Send message via ACARS
    await sendMessage({
      from: user?.callsign || 'JALV',
      to: selectedAircraft,
      type: 'telex',
      packet: requestContent
    });

    // Simulate response after 5-10 seconds
    setTimeout(() => {
      const response = Math.random() > 0.2 ? 'approved' : 'rejected'; // 80% approval rate
      setRequests(prev => 
        prev.map(req => 
          req.id === newRequest.id 
            ? { ...req, status: response as 'pending' | 'approved' | 'rejected' }
            : req
        )
      );
    }, Math.random() * 5000 + 5000);
  };

  const generateRequestContent = (featureId: string): string => {
    const templates: Record<string, string> = {
      'pdc': 'ROPS PDC REQUEST\nAIRCRAFT: JAL123\nORIGIN: RJAA\nDESTINATION: RJTT\nROUTE: VIA ROUTE A\nREQUESTING CLEARANCE',
      'cpdlc': 'ROPS CPDLC LOGON\nAIRCRAFT: JAL123\nREQUESTING CPDLC CONNECTION\nCURRENT POSITION: RJAA',
      'direct': 'ROPS DIRECT REQUEST\nAIRCRAFT: JAL123\nCURRENT POSITION: 35N 140E\nREQUESTING DIRECT TO: RJTT',
      'level': 'ROPS LEVEL REQUEST\nAIRCRAFT: JAL123\nCURRENT LEVEL: FL350\nREQUESTING: FL370\nREASON: WEATHER',
      'speed': 'ROPS SPEED REQUEST\nAIRCRAFT: JAL123\nCURRENT SPEED: M0.82\nREQUESTING: M0.85\nREASON: TRAFFIC',
      'oceanic': 'ROPS OCEANIC CLEARANCE\nAIRCRAFT: JAL123\nROUTE: PACOT 1\nENTRY POINT: NIKKO\nREQUESTING CLEARANCE'
    };

    return templates[featureId] || 'ROPS REQUEST';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-900/20';
      case 'rejected': return 'text-red-400 bg-red-900/20';
      case 'pending': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'rejected': return AlertCircle;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h3 className="text-lg font-semibold text-white">
              ROPS ATC Connection
            </h3>
          </div>
          <button
            onClick={() => setIsConnected(!isConnected)}
            className={`px-4 py-2 rounded-md transition-colors ${
              isConnected 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          {isConnected 
            ? 'Connected to ROPS ATC station - Ready for requests' 
            : 'Not connected to ROPS ATC station'
          }
        </p>
      </div>

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

      {/* ROPS Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ropsFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-4 transition-all hover:border-gray-600"
            >
              <div className="flex items-center space-x-2 mb-3">
                <Icon className="h-5 w-5 text-gray-400" />
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${feature.color}`}>
                  ROPS
                </span>
              </div>
              
              <h4 className="font-medium text-white mb-2">{feature.name}</h4>
              <p className="text-sm text-gray-400 mb-4">{feature.description}</p>
              
              <button
                onClick={() => handleROPSRequest(feature.id)}
                disabled={!isConnected || !selectedAircraft}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Send className="h-4 w-4" />
                <span>Request</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Request History */}
      {requests.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Request History</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <div className="divide-y divide-gray-700">
              {requests.map((request) => {
                const StatusIcon = getStatusIcon(request.status);
                return (
                  <div key={request.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-white">{request.type.toUpperCase()}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {request.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 font-mono bg-gray-900/50 p-2 rounded">
                      {request.details}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Random Direct To Instructions */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Random Direct To Instructions</h3>
        <p className="text-sm text-gray-400 mb-4">
          ROPS can send up to 3 random &quot;Direct To&quot; instructions during a flight
        </p>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleROPSRequest('direct')}
            disabled={!isConnected || !selectedAircraft}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simulate Random Direct To
          </button>
          <span className="text-sm text-gray-400">
            {requests.filter(r => r.type === 'direct').length}/3 used
          </span>
        </div>
      </div>
    </div>
  );
}
