// User and Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  callsign: string;
  hoppieId?: string;
  role: 'pilot' | 'dispatch' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// ACARS Message Types
export interface ACARSMessage {
  id: string;
  timestamp: Date;
  from: string;
  to: string;
  type: 'telex' | 'loadsheet' | 'report' | 'notification';
  content: string;
  status: 'sent' | 'delivered' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface HoppieMessage {
  logon: string;
  from: string;
  to: string;
  type: 'telex' | 'loadsheet' | 'report';
  packet: string;
}

// Flight Data Types
export interface Flight {
  id: string;
  callsign: string;
  origin: string;
  destination: string;
  aircraft: string;
  departureTime: Date;
  arrivalTime: Date;
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
}

export interface Loadsheet {
  flightId: string;
  aircraft: string;
  passengers: number;
  cargo: number;
  fuel: number;
  weight: number;
  balance: number;
  captain: string;
  firstOfficer: string;
}

// API Response Types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Settings Types
export interface ACARSSettings {
  autoLoadsheet: boolean;
  autoReports: boolean;
  notifications: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'dark';
}

export interface ROPSSettings {
  pdcEnabled: boolean;
  cpdlcEnabled: boolean;
  oceanicClearance: boolean;
  directToInstructions: boolean;
}
