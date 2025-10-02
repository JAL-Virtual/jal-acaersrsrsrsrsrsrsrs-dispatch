import axios from 'axios';
import { User, AuthResponse, APIResponse, ACARSMessage, HoppieMessage } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_JAL_API_URL || 'https://jalvirtual.com/api/user';
const HOPPIE_URL = process.env.NEXT_PUBLIC_HOPPIE_URL || 'http://www.hoppie.nl/acars/system/connect.html';

// JAL Virtual API Client
export class JALVirtualAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async authenticate(): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth`, {
        apiKey: this.apiKey
      });
      
      return {
        success: true,
        user: response.data.user,
        token: response.data.token
      };
    } catch (error) {
      return {
        success: false,
        message: 'Authentication failed'
      };
    }
  }

  async getUserInfo(token: string): Promise<User | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
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
      
      const response = await axios.get(url);
      
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
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  async receiveMessages(): Promise<ACARSMessage[]> {
    try {
      const url = `${HOPPIE_URL}?logon=${this.logonCode}&from=${this.dispatchCallsign}&to=${this.dispatchCallsign}&type=telex&packet=read`;
      
      const response = await axios.get(url);
      
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
    } catch (error) {
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
