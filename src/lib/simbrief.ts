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
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
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

  private parseFlightPlan(data: any): SimBriefFlightPlan {
    return {
      general: {
        icao_airline: data.general?.icao_airline || '',
        flight_number: data.general?.flight_number || '',
        callsign: data.general?.callsign || '',
        origin: {
          icao_code: data.origin?.icao_code || '',
          iata_code: data.origin?.iata_code || '',
          name: data.origin?.name || ''
        },
        destination: {
          icao_code: data.destination?.icao_code || '',
          iata_code: data.destination?.iata_code || '',
          name: data.destination?.name || ''
        },
        aircraft: {
          icao: data.aircraft?.icao || '',
          name: data.aircraft?.name || '',
          registration: data.aircraft?.registration || ''
        },
        fuel: {
          plan_ramp: parseFloat(data.fuel?.plan_ramp) || 0,
          plan_takeoff: parseFloat(data.fuel?.plan_takeoff) || 0,
          plan_landing: parseFloat(data.fuel?.plan_landing) || 0,
          plan_remains: parseFloat(data.fuel?.plan_remains) || 0,
          units: data.fuel?.units || 'lbs'
        },
        weights: {
          cargo: parseFloat(data.weights?.cargo) || 0,
          est_tow: parseFloat(data.weights?.est_tow) || 0,
          est_zfw: parseFloat(data.weights?.est_zfw) || 0,
          max_tow: parseFloat(data.weights?.max_tow) || 0,
          max_zfw: parseFloat(data.weights?.max_zfw) || 0,
          max_cargo: parseFloat(data.weights?.max_cargo) || 0,
          passenger_count: parseInt(data.weights?.passenger_count) || 0,
          passenger_weight: parseFloat(data.weights?.passenger_weight) || 0,
          units: data.weights?.units || 'lbs'
        },
        times: {
          est_departure: data.times?.est_departure || '',
          est_arrival: data.times?.est_arrival || '',
          est_duration: data.times?.est_duration || ''
        }
      },
      crew: {
        captain: data.crew?.captain || '',
        first_officer: data.crew?.first_officer || ''
      },
      loadsheet: {
        cargo: data.loadsheet?.cargo || [],
        passengers: {
          total: parseInt(data.loadsheet?.passengers?.total) || 0,
          distribution: data.loadsheet?.passengers?.distribution || []
        },
        fuel: {
          total: parseFloat(data.loadsheet?.fuel?.total) || 0,
          distribution: data.loadsheet?.fuel?.distribution || []
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
