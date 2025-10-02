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
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SimBriefPanel() {
  const { user } = useAuth();
  const [flightData, setFlightData] = useState<SimBriefFlight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        toast.success('Flight data loaded successfully!');
      } else {
        setError(result.error || 'Failed to fetch flight data');
        toast.error(result.error || 'Failed to fetch flight data');
      }
    } catch (err) {
      const errorMessage = 'Network error while fetching SimBrief data';
      setError(errorMessage);
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
          <p className="text-gray-400">No flight data loaded. Click "Load Flight" to fetch from SimBrief.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-semibold text-white">SimBrief Flight Data</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchFlightData}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                const dataStr = JSON.stringify(flightData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `simbrief-flight-${flightData.callsign}.json`;
                link.click();
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Flight Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Plane className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-gray-300">Flight</span>
            </div>
            <p className="text-white font-semibold">{flightData.callsign}</p>
            <p className="text-gray-400 text-sm">{flightData.flightNumber}</p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-300">Route</span>
            </div>
            <p className="text-white font-semibold">
              {flightData.origin.icao} → {flightData.destination.icao}
            </p>
            <p className="text-gray-400 text-sm">
              {flightData.origin.city} → {flightData.destination.city}
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Plane className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-300">Aircraft</span>
            </div>
            <p className="text-white font-semibold">{flightData.aircraft.icao}</p>
            <p className="text-gray-400 text-sm">{flightData.aircraft.registration}</p>
          </div>
        </div>
      </div>

      {/* Flight Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Times */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h4 className="text-lg font-semibold text-white">Flight Times</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Departure:</span>
              <span className="text-white">{flightData.times.departure}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Arrival:</span>
              <span className="text-white">{flightData.times.arrival}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Flight Time:</span>
              <span className="text-white">{flightData.times.flightTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Block Time:</span>
              <span className="text-white">{flightData.times.blockTime}</span>
            </div>
          </div>
        </div>

        {/* Fuel */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Fuel className="h-5 w-5 text-orange-500" />
            <h4 className="text-lg font-semibold text-white">Fuel Planning</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Planned:</span>
              <span className="text-white">{flightData.fuel.planned.toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Alternate:</span>
              <span className="text-white">{flightData.fuel.alternate.toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Reserve:</span>
              <span className="text-white">{flightData.fuel.reserve.toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between border-t border-gray-600 pt-2">
              <span className="text-gray-400 font-medium">Total:</span>
              <span className="text-white font-semibold">{flightData.fuel.total.toLocaleString()} kg</span>
            </div>
          </div>
        </div>

        {/* Weights */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Weight className="h-5 w-5 text-purple-500" />
            <h4 className="text-lg font-semibold text-white">Weight & Balance</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Payload:</span>
              <span className="text-white">{flightData.weights.payload.toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fuel:</span>
              <span className="text-white">{flightData.weights.fuel.toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max TOW:</span>
              <span className="text-white">{flightData.weights.maxTakeoff.toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between border-t border-gray-600 pt-2">
              <span className="text-gray-400 font-medium">Est. TOW:</span>
              <span className="text-white font-semibold">{flightData.weights.total.toLocaleString()} kg</span>
            </div>
          </div>
        </div>

        {/* Loadsheet */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-cyan-500" />
            <h4 className="text-lg font-semibold text-white">Loadsheet</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Passengers:</span>
              <span className="text-white">{flightData.loadsheet.passengers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cargo:</span>
              <span className="text-white">{flightData.loadsheet.cargo.toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fuel:</span>
              <span className="text-white">{flightData.loadsheet.fuel.toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between border-t border-gray-600 pt-2">
              <span className="text-gray-400 font-medium">Total Weight:</span>
              <span className="text-white font-semibold">{flightData.loadsheet.totalWeight.toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Balance:</span>
              <span className="text-white">{flightData.loadsheet.balance.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Route Information */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="h-5 w-5 text-blue-500" />
          <h4 className="text-lg font-semibold text-white">Route Information</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-medium text-gray-300 mb-2">Planned Route</h5>
            <p className="text-white font-mono text-sm bg-gray-700 p-3 rounded">
              {flightData.route.planned}
            </p>
          </div>
          <div>
            <h5 className="text-sm font-medium text-gray-300 mb-2">Flight Parameters</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Cruise Altitude:</span>
                <span className="text-white">{flightData.route.cruiseAltitude}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cruise Speed:</span>
                <span className="text-white">{flightData.route.cruiseSpeed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Alternate:</span>
                <span className="text-white">{flightData.route.alternate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
