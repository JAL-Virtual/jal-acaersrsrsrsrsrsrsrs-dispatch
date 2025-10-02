import axios from 'axios';
import { User, AuthResponse, APIResponse, ACARSMessage, HoppieMessage } from '@/types';

const API_BASE_URL = 'https://jalvirtual.com/api/user';
const HOPPIE_URL = process.env.NEXT_PUBLIC_HOPPIE_URL || 'http://www.hoppie.nl/acars/system/connect.html';

// Add timeout configuration
const axiosConfig = {
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
};

// Retry configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Retry utility function
const retryRequest = async <T>(requestFn: () => Promise<T>, attempts: number = RETRY_ATTEMPTS): Promise<T> => {
  try {
    return await requestFn();
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (attempts > 1 && (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED')) {
      console.log(`Retrying request, ${attempts - 1} attempts remaining...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryRequest(requestFn, attempts - 1);
    }
    throw error;
  }
};

// JAL Virtual API Client
export class JALVirtualAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async authenticate(): Promise<AuthResponse> {
    try {
      // Use the API key as Authorization header for JAL Virtual API
      const response = await retryRequest(() => 
        axios.get(API_BASE_URL, {
          ...axiosConfig,
          headers: {
            ...axiosConfig.headers,
            'Authorization': `Bearer ${this.apiKey}`,
          }
        })
      );
      
      // Assuming the API returns user data directly
      const userData = response.data;
      
      return {
        success: true,
        user: {
          id: userData.id || userData.pilot_id || 'unknown',
          name: userData.name || userData.pilot_name || 'Pilot',
          email: userData.email || '',
          callsign: userData.callsign || userData.aircraft_callsign || 'N/A',
          hoppieId: userData.hoppie_id || '',
          role: 'pilot' as const
        },
        token: this.apiKey // Use the API key as the token
      };
    } catch (error: unknown) {
      console.error('Authentication error:', error);
      const err = error as { code?: string; response?: { status?: number; data?: { message?: string } }; message?: string };
      
      // Enhanced error handling
      if (err.code === 'ECONNABORTED') {
        return {
          success: false,
          message: 'Connection timeout. Please check your internet connection.'
        };
      } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'Unable to connect to JAL Virtual servers. Please check your internet connection or VPN settings.'
        };
      } else if (err.response?.status === 401) {
        return {
          success: false,
          message: 'Invalid API key. Please check your credentials.'
        };
      } else if (err.response?.status === 403) {
        return {
          success: false,
          message: 'Access denied. Please contact JAL Virtual support.'
        };
      } else if (err.response?.status && err.response.status >= 500) {
        return {
          success: false,
          message: 'JAL Virtual servers are temporarily unavailable. Please try again later.'
        };
      }
      
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Authentication failed. Please check your connection and try again.'
      };
    }
  }

  async getUserInfo(token: string): Promise<User | null> {
    try {
      const response = await axios.get(API_BASE_URL, {
        ...axiosConfig,
        headers: { 
          ...axiosConfig.headers,
          'Authorization': `Bearer ${token}`,
        }
      });
      
      const userData = response.data;
      return {
        id: userData.id || userData.pilot_id || 'unknown',
        name: userData.name || userData.pilot_name || 'Pilot',
        email: userData.email || '',
        callsign: userData.callsign || userData.aircraft_callsign || 'N/A',
        hoppieId: userData.hoppie_id || '',
        role: 'pilot' as const
      };
    } catch (error) {
      return null;
    }
  }
}

// Hoppie ACARS API Client
export class HoppieAPI {
  private logonCode: string;
  private dispatchCallsign: string;

  constructor(logonCode: string, dispatchCallsign: string = 'JALV') {
    this.logonCode = logonCode;
    this.dispatchCallsign = dispatchCallsign;
  }

  async sendMessage(message: HoppieMessage): Promise<APIResponse> {
    try {
      const url = `${HOPPIE_URL}?logon=${this.logonCode}&from=${this.dispatchCallsign}&to=${message.to}&type=${message.type}&packet=${encodeURIComponent(message.packet)}`;
      
      const response = await axios.get(url, axiosConfig);
      
      if (response.data.includes('ok')) {
        return {
          success: true,
          message: 'Message sent successfully'
        };
      } else {
        return {
          success: false,
          error: 'Failed to send message'
        };
      }
    } catch (error: unknown) {
      console.error('Hoppie send message error:', error);
      const err = error as { code?: string; message?: string };
      
      if (err.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Connection timeout. Please check your internet connection.'
        };
      } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Unable to connect to Hoppie ACARS network. Please check your internet connection or VPN settings.'
        };
      }
      
      return {
        success: false,
        error: err.message || 'Network error'
      };
    }
  }

  async receiveMessages(): Promise<ACARSMessage[]> {
    try {
      const url = `${HOPPIE_URL}?logon=${this.logonCode}&from=${this.dispatchCallsign}&to=${this.dispatchCallsign}&type=telex&packet=read`;
      
      const response = await axios.get(url, axiosConfig);
      
      // Parse Hoppie response format
      const messages: ACARSMessage[] = [];
      const lines = response.data.split('\n');
      
      for (const line of lines) {
        if (line.trim() && line.includes(':')) {
          const parts = line.split(':');
          if (parts.length >= 4) {
            messages.push({
              id: Date.now().toString(),
              timestamp: new Date(),
              from: parts[0],
              to: parts[1],
              type: 'telex',
              content: parts.slice(3).join(':'),
              status: 'delivered',
              priority: 'normal'
            });
          }
        }
      }
      
      return messages;
    } catch (error: unknown) {
      console.error('Hoppie receive messages error:', error);
      const err = error as { code?: string };
      
      if (err.code === 'ECONNABORTED') {
        console.warn('Connection timeout while receiving messages');
      } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        console.warn('Unable to connect to Hoppie ACARS network');
      }
      
      return [];
    }
  }
}

// Utility functions
export const formatACARSTime = (date: Date): string => {
  return date.toISOString().replace('T', ' ').substring(0, 19) + 'Z';
};

export const generateMessageId = (): string => {
  return `MSG${Date.now().toString().slice(-6)}`;
};

export const validateCallsign = (callsign: string): boolean => {
  return /^[A-Z]{2,3}[0-9]{1,4}[A-Z]?$/.test(callsign);
};
