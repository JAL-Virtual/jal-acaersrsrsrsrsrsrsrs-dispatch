'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SimBriefAPI, SimBriefFlight } from '@/lib/simbrief';
import { 
  Plane, 
  MapPin, 
  Clock, 
  Fuel, 
  Weight, 
  Cloud, 
  Users, 
  Package,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CockpitDisplay() {
  const { user } = useAuth();
  const [flightData, setFlightData] = useState<SimBriefFlight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchFlightData = async () => {
    if (!user?.simbriefId) {
      setError('SimBrief ID not configured. Please set it in Settings.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const simbriefAPI = new SimBriefAPI(user.simbriefId);
      const result = await simbriefAPI.fetchFlightData();

      if (result.success && result.data) {
        setFlightData(result.data);
        setConnectionStatus('online');
        toast.success('Flight data loaded successfully!');
      } else {
        setError(result.error || 'Failed to fetch flight data');
        setConnectionStatus('offline');
        toast.error(result.error || 'Failed to fetch flight data');
      }
    } catch (err) {
      const errorMessage = 'Network error while fetching SimBrief data';
      setError(errorMessage);
      setConnectionStatus('offline');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.simbriefId) {
      fetchFlightData();
    }
  }, [user?.simbriefId]);

  const formatTime = (date: Date) => {
    return date.toISOString().substr(11, 8) + 'z';
  };

  const formatDate = (date: Date) => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().substr(-2);
    return `${day} ${month} ${year}`;
  };

  if (!user?.simbriefId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">SimBrief ID Required</h3>
            <p className="text-gray-400 mb-6">
              Please configure your SimBrief ID in Settings to fetch flight data.
            </p>
            <button
              onClick={() => window.location.href = '#settings'}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Main Cockpit Display */}
      <div className="max-w-7xl mx-auto">
        {/* Top Status Bar */}
        <div className="bg-gray-800 border border-gray-700 rounded-t-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-green-500" />
                <span className="text-white font-mono">FLT #: {flightData?.callsign || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">MIC:</span>
                <span className="text-white font-mono">124.85 VHF L</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">XPDR:</span>
                <span className="text-white font-mono">3012</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">SELCAL:</span>
                <span className="text-white font-mono">HS-KR</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">TAIL #:</span>
                <span className="text-white font-mono">{flightData?.aircraft.registration || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-white font-mono">UTC TIME: {formatTime(currentTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">DATE:</span>
                <span className="text-white font-mono">{formatDate(currentTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">ELAPSED TIME:</span>
                <span className="text-white font-mono">00:12</span>
              </div>
              <div className="flex items-center space-x-2">
                {connectionStatus === 'online' ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className={`font-mono ${connectionStatus === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                  {connectionStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Display Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel - Flight Information */}
          <div className="lg:col-span-1 space-y-4">
            {/* Flight Summary */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Plane className="h-5 w-5 text-green-500 mr-2" />
                Flight Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Flight:</span>
                  <span className="text-white font-mono">{flightData?.callsign || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Aircraft:</span>
                  <span className="text-white font-mono">{flightData?.aircraft.icao || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Route:</span>
                  <span className="text-white font-mono">
                    {flightData?.origin.icao || 'N/A'} → {flightData?.destination.icao || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Departure:</span>
                  <span className="text-white font-mono">{flightData?.times.departure || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Arrival:</span>
                  <span className="text-white font-mono">{flightData?.times.arrival || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Flight Time:</span>
                  <span className="text-white font-mono">{flightData?.times.flightTime || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Fuel Information */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Fuel className="h-5 w-5 text-orange-500 mr-2" />
                Fuel Planning
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Planned:</span>
                  <span className="text-white font-mono">{flightData?.fuel.planned.toLocaleString() || '0'} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Alternate:</span>
                  <span className="text-white font-mono">{flightData?.fuel.alternate.toLocaleString() || '0'} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reserve:</span>
                  <span className="text-white font-mono">{flightData?.fuel.reserve.toLocaleString() || '0'} kg</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-2">
                  <span className="text-gray-400 font-medium">Total:</span>
                  <span className="text-white font-semibold font-mono">{flightData?.fuel.total.toLocaleString() || '0'} kg</span>
                </div>
              </div>
            </div>

            {/* Weight & Balance */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Weight className="h-5 w-5 text-purple-500 mr-2" />
                Weight & Balance
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Payload:</span>
                  <span className="text-white font-mono">{flightData?.weights.payload.toLocaleString() || '0'} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fuel:</span>
                  <span className="text-white font-mono">{flightData?.weights.fuel.toLocaleString() || '0'} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max TOW:</span>
                  <span className="text-white font-mono">{flightData?.weights.maxTakeoff.toLocaleString() || '0'} kg</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-2">
                  <span className="text-gray-400 font-medium">Est. TOW:</span>
                  <span className="text-white font-semibold font-mono">{flightData?.weights.total.toLocaleString() || '0'} kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel - Primary Flight Display */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <MapPin className="h-5 w-5 text-blue-500 mr-2" />
                Primary Flight Display
              </h3>
              
              {/* Attitude Indicator */}
              <div className="relative bg-gradient-to-b from-blue-400 to-blue-600 rounded-lg h-64 mb-4 overflow-hidden">
                {/* Sky */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-blue-600"></div>
                
                {/* Ground */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-600 to-amber-500"></div>
                
                {/* Horizon Line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
                
                {/* Aircraft Symbol */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                
                {/* Pitch Lines */}
                <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-white opacity-60"></div>
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-white opacity-40"></div>
                <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-white opacity-60"></div>
                <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-white opacity-40"></div>
              </div>

              {/* Flight Parameters */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-gray-400 text-xs mb-1">AIRSPEED</div>
                  <div className="text-white font-mono text-lg">299</div>
                  <div className="text-gray-400 text-xs">KTS</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-gray-400 text-xs mb-1">ALTITUDE</div>
                  <div className="text-white font-mono text-lg">27700</div>
                  <div className="text-gray-400 text-xs">FT</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-gray-400 text-xs mb-1">HEADING</div>
                  <div className="text-white font-mono text-lg">360</div>
                  <div className="text-gray-400 text-xs">°</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-gray-400 text-xs mb-1">VERTICAL SPEED</div>
                  <div className="text-white font-mono text-lg">+1050</div>
                  <div className="text-gray-400 text-xs">FPM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Navigation & Systems */}
          <div className="lg:col-span-1 space-y-4">
            {/* Navigation Display */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <MapPin className="h-5 w-5 text-cyan-500 mr-2" />
                Navigation Display
              </h3>
              
              {/* Compass Rose */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="absolute inset-0 border-2 border-gray-600 rounded-full"></div>
                <div className="absolute inset-2 border border-gray-500 rounded-full"></div>
                <div className="absolute inset-4 border border-gray-400 rounded-full"></div>
                
                {/* Heading Markers */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((heading, index) => (
                  <div
                    key={heading}
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 origin-bottom"
                    style={{ transform: `translateX(-50%) rotate(${heading}deg) translateY(-100%)` }}
                  >
                    <div className="w-0.5 h-4 bg-white"></div>
                    <div className="text-xs text-white font-mono mt-1" style={{ transform: `rotate(-${heading}deg)` }}>
                      {heading === 0 ? 'N' : heading === 90 ? 'E' : heading === 180 ? 'S' : heading === 270 ? 'W' : heading}
                    </div>
                  </div>
                ))}
                
                {/* Aircraft Symbol */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Navigation Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">SEL HDG:</span>
                  <span className="text-white font-mono">360°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">GS:</span>
                  <span className="text-white font-mono">468 KTS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">TAS:</span>
                  <span className="text-white font-mono">458 KTS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wind:</span>
                  <span className="text-white font-mono">205°/14</span>
                </div>
              </div>
            </div>

            {/* Loadsheet */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="h-5 w-5 text-cyan-500 mr-2" />
                Loadsheet
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Passengers:</span>
                  <span className="text-white font-mono">{flightData?.loadsheet.passengers || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cargo:</span>
                  <span className="text-white font-mono">{flightData?.loadsheet.cargo.toLocaleString() || '0'} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fuel:</span>
                  <span className="text-white font-mono">{flightData?.loadsheet.fuel.toLocaleString() || '0'} kg</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-2">
                  <span className="text-gray-400 font-medium">Total Weight:</span>
                  <span className="text-white font-semibold font-mono">{flightData?.loadsheet.totalWeight.toLocaleString() || '0'} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Balance:</span>
                  <span className="text-white font-mono">{flightData?.loadsheet.balance.toFixed(2) || '0.00'}%</span>
                </div>
              </div>
            </div>

            {/* Route Information */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <MapPin className="h-5 w-5 text-green-500 mr-2" />
                Route Information
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-gray-400 text-xs mb-1">PLANNED ROUTE</div>
                  <div className="text-white font-mono text-xs bg-gray-700 p-2 rounded">
                    {flightData?.route.planned || 'N/A'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-gray-400 text-xs">CRUISE ALT</div>
                    <div className="text-white font-mono">{flightData?.route.cruiseAltitude || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">CRUISE SPD</div>
                    <div className="text-white font-mono">{flightData?.route.cruiseSpeed || 'N/A'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">ALTERNATE</div>
                  <div className="text-white font-mono">{flightData?.route.alternate || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Control Panel */}
        <div className="bg-gray-800 border border-gray-700 rounded-b-lg p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchFlightData}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
              
              <button
                onClick={() => {
                  if (flightData) {
                    const dataStr = JSON.stringify(flightData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `simbrief-flight-${flightData.callsign}.json`;
                    link.click();
                  }
                }}
                disabled={!flightData}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </button>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Dispatch Callsign:</span>
                <span className="text-white font-mono">JALV</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Hoppie ID:</span>
                <span className="text-white font-mono">{user?.hoppieId || 'Not configured'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Status:</span>
                <span className={`font-mono ${connectionStatus === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                  {connectionStatus === 'online' ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
