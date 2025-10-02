// SimBrief API Integration for Loadsheet Sync
export interface SimBriefFlightPlan {
  general: {
    icao_airline: string;
    flight_number: string;
  callsign: string;
  origin: {
      icao_code: string;
      iata_code: string;
    name: string;
  };
  destination: {
      icao_code: string;
      iata_code: string;
    name: string;
  };
  aircraft: {
    icao: string;
    name: string;
    registration: string;
  };
  fuel: {
      plan_ramp: number;
      plan_takeoff: number;
      plan_landing: number;
      plan_remains: number;
      units: string;
  };
  weights: {
      cargo: number;
      est_tow: number;
      est_zfw: number;
      max_tow: number;
      max_zfw: number;
      max_cargo: number;
      passenger_count: number;
      passenger_weight: number;
      units: string;
    };
    times: {
      est_departure: string;
      est_arrival: string;
      est_duration: string;
    };
  };
  crew: {
    captain: string;
    first_officer: string;
  };
  loadsheet: {
    cargo: Array<{
      name: string;
      weight: number;
      position: string;
    }>;
    passengers: {
      total: number;
      distribution: Array<{
        class: string;
        count: number;
        weight: number;
      }>;
    };
    fuel: {
      total: number;
      distribution: Array<{
        tank: string;
        weight: number;
      }>;
    };
  };
}

export interface SimBriefRequest {
  username: string;
  userid: string;
  type: string;
  orig: string;
  dest: string;
  acdata?: string;
  custom_airframe?: string;
}

export class SimBriefAPI {
  private baseUrl = 'https://www.simbrief.com/api/xml.fetcher.php';
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Fetch the latest flight plan for the user
  async fetchLatestFlightPlan(): Promise<SimBriefFlightPlan> {
    try {
      const params = new URLSearchParams({
        userid: this.userId,
        json: '1'
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          'User-Agent': 'JAL-ACARS/1.0'
        }
      });

        if (!response.ok) {
        throw new Error(`SimBrief API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
      console.log('Raw SimBrief API response:', data);
      const parsedData = this.parseFlightPlan(data);
      console.log('Parsed SimBrief data:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('SimBrief API error:', error);
      throw new Error(`Failed to fetch flight plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateFlightPlan(request: SimBriefRequest): Promise<SimBriefFlightPlan> {
    try {
      const params = new URLSearchParams({
        username: request.username,
        userid: request.userid,
        type: request.type,
        orig: request.orig,
        dest: request.dest,
        ...(request.acdata && { acdata: request.acdata }),
        ...(request.custom_airframe && { custom_airframe: request.custom_airframe })
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'JAL-ACARS/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`SimBrief API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseFlightPlan(data);
    } catch (error) {
      console.error('SimBrief API error:', error);
      throw new Error(`Failed to generate flight plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseFlightPlan(data: Record<string, unknown>): SimBriefFlightPlan {
    const general = data.general as Record<string, unknown> || {};
    const origin = data.origin as Record<string, unknown> || {};
    const destination = data.destination as Record<string, unknown> || {};
    const aircraft = data.aircraft as Record<string, unknown> || {};
    const fuel = data.fuel as Record<string, unknown> || {};
    const weights = data.weights as Record<string, unknown> || {};
    const times = data.times as Record<string, unknown> || {};
    const crew = data.crew as Record<string, unknown> || {};
    const loadsheet = data.loadsheet as Record<string, unknown> || {};
    const passengers = loadsheet.passengers as Record<string, unknown> || {};
    const fuelData = loadsheet.fuel as Record<string, unknown> || {};
    
    return {
      general: {
        icao_airline: (general.icao_airline as string) || '',
        flight_number: (general.flight_number as string) || '',
        callsign: (general.callsign as string) || '',
      origin: {
          icao_code: (origin.icao_code as string) || '',
          iata_code: (origin.iata_code as string) || '',
          name: (origin.name as string) || ''
      },
      destination: {
          icao_code: (destination.icao_code as string) || '',
          iata_code: (destination.iata_code as string) || '',
          name: (destination.name as string) || ''
      },
      aircraft: {
          icao: (aircraft.icao as string) || '',
          name: (aircraft.name as string) || '',
          registration: (aircraft.registration as string) || ''
      },
      fuel: {
          plan_ramp: parseFloat(fuel.plan_ramp as string) || 0,
          plan_takeoff: parseFloat(fuel.plan_takeoff as string) || 0,
          plan_landing: parseFloat(fuel.plan_landing as string) || 0,
          plan_remains: parseFloat(fuel.plan_remains as string) || 0,
          units: (fuel.units as string) || 'lbs'
      },
      weights: {
          cargo: parseFloat(weights.cargo as string) || 0,
          est_tow: parseFloat(weights.est_tow as string) || 0,
          est_zfw: parseFloat(weights.est_zfw as string) || 0,
          max_tow: parseFloat(weights.max_tow as string) || 0,
          max_zfw: parseFloat(weights.max_zfw as string) || 0,
          max_cargo: parseFloat(weights.max_cargo as string) || 0,
          passenger_count: parseInt(weights.passenger_count as string) || 0,
          passenger_weight: parseFloat(weights.passenger_weight as string) || 0,
          units: (weights.units as string) || 'lbs'
        },
        times: {
          est_departure: (times.est_departure as string) || '',
          est_arrival: (times.est_arrival as string) || '',
          est_duration: (times.est_duration as string) || ''
        }
      },
      crew: {
        captain: (crew.captain as string) || '',
        first_officer: (crew.first_officer as string) || ''
      },
      loadsheet: {
        cargo: (loadsheet.cargo as Array<{ name: string; weight: number; position: string }>) || [],
        passengers: {
          total: parseInt(passengers.total as string) || 0,
          distribution: (passengers.distribution as Array<{ class: string; count: number; weight: number }>) || []
        },
        fuel: {
          total: parseFloat(fuelData.total as string) || 0,
          distribution: (fuelData.distribution as Array<{ tank: string; weight: number }>) || []
        }
      }
    };
  }

  // Convert SimBrief data to ACARS loadsheet format
  formatLoadsheet(flightPlan: SimBriefFlightPlan, type: 'preliminary' | 'final'): string {
    const { general, crew, loadsheet } = flightPlan;
    
    const loadsheetType = type === 'preliminary' ? 'PRELIMINARY LOADSHEET' : 'FINAL LOADSHEET';
    
    let loadsheetText = `${loadsheetType}\n`;
    loadsheetText += `FLIGHT: ${general.callsign}\n`;
    loadsheetText += `AIRCRAFT: ${general.aircraft.name} (${general.aircraft.registration})\n`;
    loadsheetText += `ROUTE: ${general.origin.icao_code} → ${general.destination.icao_code}\n`;
    loadsheetText += `PAX: ${general.weights.passenger_count}\n`;
    loadsheetText += `CARGO: ${general.weights.cargo}${general.weights.units}\n`;
    loadsheetText += `FUEL: ${general.fuel.plan_takeoff}${general.fuel.units}\n`;
    
    if (type === 'final') {
      loadsheetText += `ZFW: ${general.weights.est_zfw}${general.weights.units}\n`;
      loadsheetText += `TOW: ${general.weights.est_tow}${general.weights.units}\n`;
    }
    
    loadsheetText += `CAPTAIN: ${crew.captain}\n`;
    loadsheetText += `FO: ${crew.first_officer}\n`;
    
    if (loadsheet.cargo.length > 0) {
      loadsheetText += `\nCARGO BREAKDOWN:\n`;
      loadsheet.cargo.forEach(item => {
        loadsheetText += `${item.name}: ${item.weight}${general.weights.units} (${item.position})\n`;
      });
    }
    
    if (loadsheet.passengers.distribution.length > 0) {
      loadsheetText += `\nPAX BREAKDOWN:\n`;
      loadsheet.passengers.distribution.forEach(pax => {
        loadsheetText += `${pax.class}: ${pax.count} pax (${pax.weight}${general.weights.units})\n`;
      });
    }
    
    if (loadsheet.fuel.distribution.length > 0) {
      loadsheetText += `\nFUEL BREAKDOWN:\n`;
      loadsheet.fuel.distribution.forEach(tank => {
        loadsheetText += `${tank.tank}: ${tank.weight}${general.fuel.units}\n`;
      });
    }
    
    return loadsheetText;
  }

  // Validate SimBrief credentials
  async validateCredentials(username: string, userid: string): Promise<boolean> {
    try {
      const testRequest: SimBriefRequest = {
        username,
        userid,
        type: 'IFR',
        orig: 'RJAA',
        dest: 'RJTT'
      };
      
      await this.generateFlightPlan(testRequest);
      return true;
    } catch (error) {
      console.error('SimBrief credentials validation failed:', error);
      return false;
    }
  }
}

// Utility functions for loadsheet management
export const loadsheetUtils = {
  // Convert weight units
  convertWeight(value: number, fromUnit: string, toUnit: string): number {
    if (fromUnit === toUnit) return value;
    
    // Convert to kg first
    let kgValue = value;
    if (fromUnit === 'lbs') {
      kgValue = value * 0.453592;
    } else if (fromUnit === 'kg') {
      kgValue = value;
    }
    
    // Convert from kg to target unit
    if (toUnit === 'lbs') {
      return kgValue / 0.453592;
    } else if (toUnit === 'kg') {
      return kgValue;
    }
    
    return value;
  },

  // Format weight with units
  formatWeight(value: number, unit: string): string {
    return `${Math.round(value)}${unit}`;
  },

  // Calculate fuel efficiency
  calculateFuelEfficiency(flightPlan: SimBriefFlightPlan): {
    fuelPerHour: number;
    fuelPerNM: number;
    efficiency: string;
  } {
    const { fuel, times } = flightPlan.general;
    const duration = this.parseDuration(times.est_duration);
    const fuelUsed = fuel.plan_takeoff - fuel.plan_landing;
    
    const fuelPerHour = duration > 0 ? fuelUsed / duration : 0;
    const fuelPerNM = fuelPerHour / 500; // Assuming 500 NM average speed
    
    let efficiency = 'Normal';
    if (fuelPerHour < 8000) efficiency = 'Excellent';
    else if (fuelPerHour > 12000) efficiency = 'High Consumption';
    
    return {
      fuelPerHour: Math.round(fuelPerHour),
      fuelPerNM: Math.round(fuelPerNM),
      efficiency
    };
  },

  // Parse duration string to hours
  parseDuration(duration: string): number {
    const match = duration.match(/(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      return hours + (minutes / 60);
    }
    return 0;
  },

  // Generate loadsheet summary
  generateSummary(flightPlan: SimBriefFlightPlan): string {
    const { general } = flightPlan;
    const efficiency = this.calculateFuelEfficiency(flightPlan);
    
    return `Flight ${general.callsign}: ${general.weights.passenger_count} pax, ${general.weights.cargo}${general.weights.units} cargo, ${general.fuel.plan_takeoff}${general.fuel.units} fuel. Efficiency: ${efficiency.efficiency}`;
  }
};
