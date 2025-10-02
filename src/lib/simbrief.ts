import { APIResponse } from '@/types';

// SimBrief API Configuration
const SIMBRIEF_API_BASE = 'https://www.simbrief.com/api/xml.fetcher.php';

// SimBrief Flight Data Types
export interface SimBriefFlight {
  id: string;
  callsign: string;
  flightNumber: string;
  origin: {
    icao: string;
    iata: string;
    name: string;
    city: string;
    country: string;
  };
  destination: {
    icao: string;
    iata: string;
    name: string;
    city: string;
    country: string;
  };
  aircraft: {
    icao: string;
    name: string;
    registration: string;
  };
  route: {
    planned: string;
    alternate: string;
    cruiseAltitude: string;
    cruiseSpeed: string;
  };
  times: {
    departure: string;
    arrival: string;
    blockTime: string;
    flightTime: string;
  };
  fuel: {
    planned: number;
    alternate: number;
    reserve: number;
    total: number;
  };
  weights: {
    payload: number;
    fuel: number;
    total: number;
    maxTakeoff: number;
  };
  weather: {
    origin: {
      wind: string;
      visibility: string;
      temperature: string;
      pressure: string;
    };
    destination: {
      wind: string;
      visibility: string;
      temperature: string;
      pressure: string;
    };
  };
  loadsheet: {
    passengers: number;
    cargo: number;
    fuel: number;
    totalWeight: number;
    balance: number;
  };
}

// SimBrief API Client
export class SimBriefAPI {
  private username: string;

  constructor(username: string) {
    this.username = username;
  }

  async fetchFlightData(): Promise<APIResponse<SimBriefFlight>> {
    try {
      const url = `${SIMBRIEF_API_BASE}?username=${encodeURIComponent(this.username)}&json=1`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `SimBrief API error: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      
      if (data.fetch.status === 'Success') {
        const flight = this.parseFlightData(data);
        return {
          success: true,
          data: flight,
          message: 'Flight data retrieved successfully'
        };
      } else {
        return {
          success: false,
          error: data.fetch.status || 'Failed to fetch flight data'
        };
      }
    } catch (error: unknown) {
      console.error('SimBrief API error:', error);
      const err = error as { message?: string };
      return {
        success: false,
        error: err.message || 'Network error while fetching SimBrief data'
      };
    }
  }

  private parseFlightData(data: any): SimBriefFlight {
    const flight = data.fetch;
    
    return {
      id: flight.id || Date.now().toString(),
      callsign: flight.callsign || 'N/A',
      flightNumber: flight.flight_number || 'N/A',
      origin: {
        icao: flight.origin?.icao_code || 'N/A',
        iata: flight.origin?.iata_code || 'N/A',
        name: flight.origin?.name || 'N/A',
        city: flight.origin?.city || 'N/A',
        country: flight.origin?.country || 'N/A'
      },
      destination: {
        icao: flight.destination?.icao_code || 'N/A',
        iata: flight.destination?.iata_code || 'N/A',
        name: flight.destination?.name || 'N/A',
        city: flight.destination?.city || 'N/A',
        country: flight.destination?.country || 'N/A'
      },
      aircraft: {
        icao: flight.aircraft?.icao_code || 'N/A',
        name: flight.aircraft?.name || 'N/A',
        registration: flight.aircraft?.registration || 'N/A'
      },
      route: {
        planned: flight.navlog?.route || 'N/A',
        alternate: flight.alternate?.icao_code || 'N/A',
        cruiseAltitude: flight.general?.cruise_altitude || 'N/A',
        cruiseSpeed: flight.general?.cruise_tas || 'N/A'
      },
      times: {
        departure: flight.times?.sched_out || 'N/A',
        arrival: flight.times?.sched_in || 'N/A',
        blockTime: flight.times?.est_block || 'N/A',
        flightTime: flight.times?.est_time_enroute || 'N/A'
      },
      fuel: {
        planned: parseInt(flight.fuel?.plan_ramp || '0'),
        alternate: parseInt(flight.fuel?.plan_taxi || '0'),
        reserve: parseInt(flight.fuel?.plan_alternate || '0'),
        total: parseInt(flight.fuel?.plan_total || '0')
      },
      weights: {
        payload: parseInt(flight.weights?.payload || '0'),
        fuel: parseInt(flight.weights?.fuel_weight || '0'),
        total: parseInt(flight.weights?.est_tow || '0'),
        maxTakeoff: parseInt(flight.weights?.max_tow || '0')
      },
      weather: {
        origin: {
          wind: flight.weather?.origin?.wind || 'N/A',
          visibility: flight.weather?.origin?.visibility || 'N/A',
          temperature: flight.weather?.origin?.temperature || 'N/A',
          pressure: flight.weather?.origin?.pressure || 'N/A'
        },
        destination: {
          wind: flight.weather?.destination?.wind || 'N/A',
          visibility: flight.weather?.destination?.visibility || 'N/A',
          temperature: flight.weather?.destination?.temperature || 'N/A',
          pressure: flight.weather?.destination?.pressure || 'N/A'
        }
      },
      loadsheet: {
        passengers: parseInt(flight.loadsheet?.passengers || '0'),
        cargo: parseInt(flight.loadsheet?.cargo || '0'),
        fuel: parseInt(flight.loadsheet?.fuel || '0'),
        totalWeight: parseInt(flight.loadsheet?.total_weight || '0'),
        balance: parseFloat(flight.loadsheet?.balance || '0')
      }
    };
  }
}

// Utility functions
export const formatSimBriefTime = (timeString: string): string => {
  if (timeString === 'N/A') return timeString;
  // Convert SimBrief time format to readable format
  return timeString;
};

export const formatSimBriefWeight = (weight: number): string => {
  return `${weight.toLocaleString()} kg`;
};

export const formatSimBriefFuel = (fuel: number): string => {
  return `${fuel.toLocaleString()} kg`;
};
