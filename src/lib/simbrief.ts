import { APIResponse } from '@/types';

// SimBrief API Configuration
const SIMBRIEF_API_BASE = 'https://www.simbrief.com/api/xml.fetcher.php';

// SimBrief API Response Types
interface SimBriefAPIResponse {
  [key: string]: unknown;
  callsign?: string;
  flight_number?: string;
  origin?: {
    icao_code?: string;
    icao?: string;
    iata_code?: string;
    iata?: string;
    name?: string;
    city?: string;
    country?: string;
  };
  destination?: {
    icao_code?: string;
    icao?: string;
    iata_code?: string;
    iata?: string;
    name?: string;
    city?: string;
    country?: string;
  };
  aircraft?: {
    icao_code?: string;
    icao?: string;
    name?: string;
    registration?: string;
  };
  atc?: {
    callsign?: string;
  };
  navlog?: {
    route?: string;
  };
  route?: string;
  alternate?: {
    icao_code?: string;
    icao?: string;
  };
  general?: {
    cruise_altitude?: string;
    cruise_tas?: string;
  };
  cruise_altitude?: string;
  cruise_speed?: string;
  times?: {
    sched_out?: string;
    sched_in?: string;
    est_block?: string;
    est_time_enroute?: string;
  };
  departure_time?: string;
  arrival_time?: string;
  block_time?: string;
  flight_time?: string;
  fuel?: {
    plan_ramp?: string;
    planned?: string;
    alternate_burn?: string;
    alternate?: string;
    reserve?: string;
    total?: string;
    taxi?: string;
    enroute_burn?: string;
    contingency?: string;
    etops?: string;
    min_takeoff?: string;
    plan_takeoff?: string;
    plan_landing?: string;
    avg_fuel_flow?: string;
    max_tanks?: string;
  };
  weights?: {
    payload?: string;
    fuel_weight?: string;
    est_tow?: string;
    max_tow?: string;
  };
  payload?: string;
  fuel_weight?: string;
  est_tow?: string;
  max_tow?: string;
  weather?: {
    origin?: {
      wind?: string;
      visibility?: string;
      temperature?: string;
      pressure?: string;
    };
    destination?: {
      wind?: string;
      visibility?: string;
      temperature?: string;
      pressure?: string;
    };
  };
  loadsheet?: {
    passengers?: string;
    cargo?: string;
    fuel?: string;
    total_weight?: string;
    balance?: string;
  };
  passengers?: string;
  cargo?: string;
  total_weight?: string;
  balance?: string;
  id?: string;
}

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
    taxi: number;
    enroute: number;
    contingency: number;
    etops: number;
    minTakeoff: number;
    planTakeoff: number;
    planLanding: number;
    avgFuelFlow: number;
    maxTanks: number;
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
      const url = `${SIMBRIEF_API_BASE}?userid=${encodeURIComponent(this.username)}&json=v2`;
      console.log('SimBrief API URL:', url); // Debug log
      console.log('SimBrief Username:', this.username); // Debug log
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('SimBrief Response Status:', response.status); // Debug log
      console.log('SimBrief Response OK:', response.ok); // Debug log

      if (!response.ok) {
        const errorText = await response.text();
        console.log('SimBrief Error Response:', errorText); // Debug log
        return {
          success: false,
          error: `SimBrief API error: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      console.log('SimBrief API Response:', data); // Debug log
      console.log('SimBrief Response Type:', typeof data); // Debug log
      console.log('SimBrief Response Keys:', Object.keys(data)); // Debug log
      
      if (data.fetch && data.fetch.status === 'Success') {
        const flight = this.parseFlightData(data);
        console.log('Parsed Flight Data:', flight); // Debug log
        return {
          success: true,
          data: flight,
          message: 'Flight data retrieved successfully'
        };
      } else if (data.status === 'Success' || data.fetch?.status === 'Success') {
        // Handle different response formats
        const flight = this.parseFlightData(data);
        console.log('Parsed Flight Data (alternative format):', flight); // Debug log
        return {
          success: true,
          data: flight,
          message: 'Flight data retrieved successfully'
        };
      } else {
        console.log('SimBrief API Error:', data.fetch?.status || data.status || 'Unknown error'); // Debug log
        console.log('SimBrief Error Data:', data); // Debug log
        return {
          success: false,
          error: data.fetch?.status || data.status || 'Failed to fetch flight data'
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

  private parseFlightData(data: Record<string, unknown>): SimBriefFlight {
    // Handle different response formats
    console.log('Full API response structure:', data); // Debug log
    
    // Try different possible structures
    let flight: SimBriefAPIResponse = (data.fetch as SimBriefAPIResponse) || (data as SimBriefAPIResponse);
    
    // If data.fetch doesn't exist, try the data itself
    if (!flight || Object.keys(flight).length < 5) {
      console.log('Trying data directly...'); // Debug log
      flight = data as SimBriefAPIResponse;
    }
    
    console.log('Raw flight data:', flight); // Debug log
    console.log('Flight data keys:', Object.keys(flight || {})); // Debug log
    
    // Check for common SimBrief fields
    console.log('Flight callsign:', flight?.callsign); // Debug log
    console.log('ATC callsign:', flight?.atc?.callsign); // Debug log
    console.log('Flight origin:', flight?.origin); // Debug log
    console.log('Flight destination:', flight?.destination); // Debug log
    console.log('Flight aircraft:', flight?.aircraft); // Debug log
    console.log('Flight fuel:', flight?.fuel); // Debug log
    console.log('Flight weights:', flight?.weights); // Debug log
    console.log('Flight loadsheet:', flight?.loadsheet); // Debug log
    
    return {
      id: flight.id || Date.now().toString(),
      callsign: flight.callsign || flight.atc?.callsign || 'N/A',
      flightNumber: flight.flight_number || 'N/A',
      origin: {
        icao: flight.origin?.icao_code || flight.origin?.icao || 'N/A',
        iata: flight.origin?.iata_code || flight.origin?.iata || 'N/A',
        name: flight.origin?.name || 'N/A',
        city: flight.origin?.city || 'N/A',
        country: flight.origin?.country || 'N/A'
      },
      destination: {
        icao: flight.destination?.icao_code || flight.destination?.icao || 'N/A',
        iata: flight.destination?.iata_code || flight.destination?.iata || 'N/A',
        name: flight.destination?.name || 'N/A',
        city: flight.destination?.city || 'N/A',
        country: flight.destination?.country || 'N/A'
      },
      aircraft: {
        icao: flight.aircraft?.icao_code || flight.aircraft?.icao || 'N/A',
        name: flight.aircraft?.name || 'N/A',
        registration: flight.aircraft?.registration || 'N/A'
      },
      route: {
        planned: flight.navlog?.route || flight.route || 'N/A',
        alternate: flight.alternate?.icao_code || flight.alternate?.icao || 'N/A',
        cruiseAltitude: flight.general?.cruise_altitude || flight.cruise_altitude || 'N/A',
        cruiseSpeed: flight.general?.cruise_tas || flight.cruise_speed || 'N/A'
      },
      times: {
        departure: flight.times?.sched_out || flight.departure_time || 'N/A',
        arrival: flight.times?.sched_in || flight.arrival_time || 'N/A',
        blockTime: flight.times?.est_block || flight.block_time || 'N/A',
        flightTime: flight.times?.est_time_enroute || flight.flight_time || 'N/A'
      },
      fuel: {
        planned: parseInt(flight.fuel?.plan_ramp || flight.fuel?.planned || '0'),
        alternate: parseInt(flight.fuel?.alternate_burn || flight.fuel?.alternate || '0'),
        reserve: parseInt(flight.fuel?.reserve || flight.fuel?.reserve || '0'),
        total: parseInt(flight.fuel?.plan_ramp || flight.fuel?.total || '0'),
        taxi: parseInt(flight.fuel?.taxi || '0'),
        enroute: parseInt(flight.fuel?.enroute_burn || '0'),
        contingency: parseInt(flight.fuel?.contingency || '0'),
        etops: parseInt(flight.fuel?.etops || '0'),
        minTakeoff: parseInt(flight.fuel?.min_takeoff || '0'),
        planTakeoff: parseInt(flight.fuel?.plan_takeoff || '0'),
        planLanding: parseInt(flight.fuel?.plan_landing || '0'),
        avgFuelFlow: parseInt(flight.fuel?.avg_fuel_flow || '0'),
        maxTanks: parseInt(flight.fuel?.max_tanks || '0')
      },
      weights: {
        payload: parseInt(flight.weights?.payload || flight.payload || '0'),
        fuel: parseInt(flight.weights?.fuel_weight || flight.fuel_weight || '0'),
        total: parseInt(flight.weights?.est_tow || flight.est_tow || '0'),
        maxTakeoff: parseInt(flight.weights?.max_tow || flight.max_tow || '0')
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
        passengers: parseInt(flight.loadsheet?.passengers || flight.passengers || '0'),
        cargo: parseInt(flight.loadsheet?.cargo || flight.cargo || '0'),
        fuel: parseInt(typeof flight.loadsheet?.fuel === 'string' ? flight.loadsheet.fuel : typeof flight.fuel === 'string' ? flight.fuel : '0'),
        totalWeight: parseInt(flight.loadsheet?.total_weight || flight.total_weight || '0'),
        balance: parseFloat(flight.loadsheet?.balance || flight.balance || '0')
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
