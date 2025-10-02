'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SimBriefAPI, SimBriefFlight } from '@/lib/simbrief';
import { 
  Plane, 
  MapPin, 
  Clock, 
  Fuel, 
  Weight, 
  Users, 
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Utility function to format date/time
const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString || dateTimeString === 'N/A') return 'N/A';
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return dateTimeString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} | ${hours}:${minutes}`;
  } catch {
    return dateTimeString;
  }
};

// Utility function to format Zulu time
const formatZuluTime = (dateTimeString: string): string => {
  if (!dateTimeString || dateTimeString === 'N/A') return 'N/A';
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return dateTimeString;
    
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} | ${hours}:${minutes}Z`;
  } catch {
    return dateTimeString;
  }
};

// Utility function to check if flight is an airline flight
const isAirlineFlight = (callsign: string): boolean => {
  if (!callsign || callsign === 'N/A') return false;
  
  // Common airline patterns: 2-3 letters followed by numbers
  // Examples: JAL123, ANA456, UAL789, BA123, LH456
  const airlinePattern = /^[A-Z]{2,3}[0-9]{1,4}[A-Z]?$/;
  const isAirline = airlinePattern.test(callsign);
  
  // Also check if it's a private aircraft registration (N-prefix, etc.)
  const privatePattern = /^[A-Z]{1,2}[0-9]{1,4}[A-Z]?$/;
  const isPrivate = privatePattern.test(callsign) && !airlinePattern.test(callsign);
  
  console.log('Callsign analysis:', { callsign, isAirline, isPrivate });
  
  return isAirline;
};

export default function SimBriefPanel() {
  const { user } = useAuth();
  const [flightData, setFlightData] = useState<SimBriefFlight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchFlightData = useCallback(async () => {
    if (!user?.simbriefId) {
      setError('SimBrief ID not configured. Please set it in Settings.');
      return;
    }

    // Prevent duplicate calls
    if (isFetchingRef.current) {
      console.log('SimBrief fetch already in progress, skipping...');
      return;
    }

    console.log('Starting SimBrief fetch for ID:', user.simbriefId); // Debug log
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const simbriefAPI = new SimBriefAPI(user.simbriefId);
      const result = await simbriefAPI.fetchFlightData();

      console.log('SimBrief API result:', result); // Debug log

      if (result.success && result.data) {
        setFlightData(result.data);
        if (!hasLoaded) {
          toast.success('Flight data loaded successfully!');
          setHasLoaded(true);
        }
      } else {
        setError(result.error || 'Failed to fetch flight data');
        toast.error(result.error || 'Failed to fetch flight data');
      }
    } catch (err) {
      console.error('SimBrief fetch error:', err); // Debug log
      const errorMessage = 'Network error while fetching SimBrief data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.simbriefId, hasLoaded]);

  useEffect(() => {
    console.log('SimBriefPanel useEffect triggered', { simbriefId: user?.simbriefId, hasLoaded });
    if (user?.simbriefId) {
      setHasLoaded(false); // Reset hasLoaded when SimBrief ID changes
      isFetchingRef.current = false; // Reset fetching flag when SimBrief ID changes
      fetchFlightData();
    }
  }, [user?.simbriefId, fetchFlightData, hasLoaded]);

  if (!user?.simbriefId) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">SimBrief ID Required</h3>
          <p className="text-gray-400 mb-4">
            Please configure your SimBrief ID in Settings to fetch flight data.
          </p>
          <button
            onClick={() => window.location.href = '#settings'}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">SimBrief Flight Data</h3>
          <button
            onClick={fetchFlightData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
        </div>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!flightData) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">SimBrief Flight Data</h3>
          <button
            onClick={fetchFlightData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Loading...' : 'Load Flight'}</span>
          </button>
        </div>
        <div className="text-center">
          <Plane className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No flight data loaded. Click &quot;Load Flight&quot; to fetch from SimBrief.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-xl blur-lg"></div>
              <div className="relative bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">SimBrief Flight Data</h3>
              <p className="text-gray-400">Real-time flight planning information</p>
            </div>
          </div>
          <button
            onClick={fetchFlightData}
            disabled={isLoading}
            className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="font-medium">Refresh</span>
          </button>
        </div>

        {/* Flight Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Flight Card */}
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-6 border border-red-500/20 backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-500/20 p-2 rounded-lg">
                <Plane className="h-6 w-6 text-red-400" />
              </div>
              <span className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Flight</span>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{flightData.callsign}</p>
              {flightData.flightNumber && flightData.flightNumber !== 'N/A' && (
                <p className="text-gray-400 text-sm font-medium">{flightData.flightNumber}</p>
              )}
            </div>
          </div>

          {/* Route Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-6 border border-blue-500/20 backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Route</span>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">
                {flightData.origin.icao} → {flightData.destination.icao}
              </p>
              <p className="text-gray-400 text-sm font-medium">
                {(() => {
                  const isAirline = isAirlineFlight(flightData.callsign);
                  console.log('Callsign:', flightData.callsign, 'Is Airline:', isAirline);
                  console.log('Origin IATA:', flightData.origin.iata, 'Destination IATA:', flightData.destination.iata);
                  console.log('Aircraft Registration:', flightData.aircraft.registration);
                  
                  // If IATA codes are available and not N/A, show them
                  if (flightData.origin.iata !== 'N/A' && flightData.destination.iata !== 'N/A') {
                    return `${flightData.origin.iata} → ${flightData.destination.iata}`;
                  }
                  
                  // Otherwise show aircraft registration
                  return flightData.aircraft.registration;
                })()}
              </p>
            </div>
          </div>

          {/* Aircraft Card */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-6 border border-green-500/20 backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <Plane className="h-6 w-6 text-green-400" />
              </div>
              <span className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Aircraft</span>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{flightData.aircraft.icao}</p>
              {flightData.aircraft.registration && flightData.aircraft.registration !== 'N/A' && (
                <p className="text-gray-400 text-sm font-medium">{flightData.aircraft.registration}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flight Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Times Card */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl p-6 border border-yellow-500/20 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-yellow-500/20 p-2 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
            <h4 className="text-lg font-bold text-white">Flight Times</h4>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Departure</span>
              <div className="text-right">
                <div className="text-white font-semibold">{formatDateTime(flightData.times.departure)}</div>
                <div className="text-gray-400 text-xs">{formatZuluTime(flightData.times.departure)}</div>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Arrival</span>
              <div className="text-right">
                <div className="text-white font-semibold">{formatDateTime(flightData.times.arrival)}</div>
                <div className="text-gray-400 text-xs">{formatZuluTime(flightData.times.arrival)}</div>
              </div>
            </div>
            <div className="border-t border-gray-600/50 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Flight Time</span>
                <span className="text-white font-medium">{flightData.times.flightTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Block Time</span>
                <span className="text-white font-medium">{flightData.times.blockTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fuel Card */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-6 border border-orange-500/20 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <Fuel className="h-6 w-6 text-orange-400" />
            </div>
            <h4 className="text-lg font-bold text-white">Fuel Planning</h4>
          </div>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Taxi</span>
                <span className="text-white font-semibold">{(flightData.fuel.taxi || 0).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Enroute</span>
                <span className="text-white font-semibold">{(flightData.fuel.enroute || 0).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Contingency</span>
                <span className="text-white font-semibold">{(flightData.fuel.contingency || 0).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Alternate</span>
                <span className="text-white font-semibold">{(flightData.fuel.alternate || 0).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Reserve</span>
                <span className="text-white font-semibold">{(flightData.fuel.reserve || 0).toLocaleString()} kg</span>
              </div>
              {(flightData.fuel.etops || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">ETOPS</span>
                  <span className="text-white font-semibold">{(flightData.fuel.etops || 0).toLocaleString()} kg</span>
                </div>
              )}
            </div>
            <div className="border-t border-gray-600/50 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Plan Ramp</span>
                <span className="text-lg font-bold text-orange-400">{(flightData.fuel.planned || 0).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Plan Landing</span>
                <span className="text-white font-medium">{(flightData.fuel.planLanding || 0).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Avg Fuel Flow</span>
                <span className="text-white font-medium">{(flightData.fuel.avgFuelFlow || 0).toLocaleString()} kg/hr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weights Card */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-6 border border-purple-500/20 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <Weight className="h-6 w-6 text-purple-400" />
            </div>
            <h4 className="text-lg font-bold text-white">Weight & Balance</h4>
          </div>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Payload</span>
                <span className="text-white font-semibold">{(flightData.weights.payload || 0).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Fuel</span>
                <span className="text-white font-semibold">{(flightData.weights.fuel || 0).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Max TOW</span>
                <span className="text-white font-semibold">{(flightData.weights.maxTakeoff || 0).toLocaleString()} kg</span>
              </div>
            </div>
            <div className="border-t border-gray-600/50 pt-4">
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Est. TOW</span>
                <span className="text-lg font-bold text-purple-400">{(flightData.weights.total || 0).toLocaleString()} kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loadsheet Card */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-xl p-6 border border-cyan-500/20 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-cyan-500/20 p-2 rounded-lg">
              <Users className="h-6 w-6 text-cyan-400" />
            </div>
            <h4 className="text-lg font-bold text-white">Loadsheet</h4>
          </div>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Passengers</span>
                <span className="text-white font-semibold">{flightData.loadsheet.passengers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Cargo</span>
                <span className="text-white font-semibold">{(flightData.loadsheet.cargo || 0).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Fuel</span>
                <span className="text-white font-semibold">{(flightData.loadsheet.fuel || 0).toLocaleString()} kg</span>
              </div>
            </div>
            <div className="border-t border-gray-600/50 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Total Weight</span>
                <span className="text-lg font-bold text-cyan-400">{(flightData.loadsheet.totalWeight || 0).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Balance</span>
                <span className="text-white font-medium">{(flightData.loadsheet.balance || 0).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Route Information */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-blue-500/20 p-3 rounded-xl">
            <MapPin className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-white">Route Information</h4>
            <p className="text-gray-400">Flight path and navigation details</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h5 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Planned Route</h5>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <p className="text-white font-mono text-lg leading-relaxed">
                {flightData.route.planned}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <h5 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Flight Parameters</h5>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Cruise Altitude</span>
                <span className="text-white font-bold text-lg">{flightData.route.cruiseAltitude}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Cruise Speed</span>
                <span className="text-white font-bold text-lg">{flightData.route.cruiseSpeed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Alternate</span>
                <span className="text-white font-bold text-lg">{flightData.route.alternate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
